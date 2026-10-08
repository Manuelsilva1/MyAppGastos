package com.manuelsilva.finanzas.transactions;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.manuelsilva.finanzas.accounts.Account;
import com.manuelsilva.finanzas.accounts.AccountRepository;
import com.manuelsilva.finanzas.categories.Category;
import com.manuelsilva.finanzas.categories.CategoryRepository;
import com.manuelsilva.finanzas.common.ApiException;
import com.manuelsilva.finanzas.common.AuditLog;
import com.manuelsilva.finanzas.common.MoneyFormat;
import com.manuelsilva.finanzas.transactions.TransactionDtos.TransactionCreateRequest;
import com.manuelsilva.finanzas.transactions.TransactionDtos.TransactionPage;
import com.manuelsilva.finanzas.transactions.TransactionDtos.TransactionResponse;
import com.manuelsilva.finanzas.transactions.TransactionDtos.VoidRequest;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionService {

    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 200;

    private final TransactionRepository transactions;
    private final AccountRepository accounts;
    private final CategoryRepository categories;
    private final AuditLog audit;
    private final EntityManager em;

    public TransactionService(TransactionRepository transactions, AccountRepository accounts,
                              CategoryRepository categories, AuditLog audit, EntityManager em) {
        this.transactions = transactions;
        this.accounts = accounts;
        this.categories = categories;
        this.audit = audit;
        this.em = em;
    }

    /** Resultado del alta: si ya existía (reintento idempotente) no se creó nada nuevo. */
    public record CreateResult(TransactionResponse transaction, boolean created) {
    }

    @Transactional
    public CreateResult create(UUID userId, TransactionCreateRequest r) {
        BigDecimal amount = signedAmount(r);
        Optional<Transaction> existing = transactions.findById(r.id());
        if (existing.isPresent()) {
            Transaction tx = existing.get();
            // Mismo id con otro contenido, o de otro usuario: nunca se sobrescribe ni se revela.
            if (!tx.getUserId().equals(userId) || !sameContent(tx, r, amount)) {
                throw ApiException.conflict("ID_REUSED_WITH_DIFFERENT_PAYLOAD",
                        "Ya existe un movimiento con ese id y datos distintos.");
            }
            return new CreateResult(toResponse(tx), false);
        }

        Account account = accounts.findByIdAndUserId(r.accountId(), userId)
                .orElseThrow(() -> ApiException.unprocessable("La cuenta indicada no existe."));
        if (account.getArchivedAt() != null) {
            throw ApiException.unprocessable("La cuenta está archivada y no admite movimientos nuevos.");
        }
        checkCategory(userId, r.type(), r.categoryId());

        Transaction tx = transactions.saveAndFlush(new Transaction(
                r.id(), userId, account.getId(), r.type(), amount, r.categoryId(), null,
                blankToNull(r.description()), blankToNull(r.note()), r.occurredOn()));
        TransactionResponse response = toResponse(tx);
        audit.record(userId, "transactions", tx.getId(), "CREATE", null, response);
        return new CreateResult(response, true);
    }

    /** Gasto: negativo; ingreso: positivo; ajuste: el signo que viene. Cero no es válido. */
    static BigDecimal signedAmount(TransactionCreateRequest r) {
        BigDecimal value = MoneyFormat.parse(r.amount());
        if (value.signum() == 0) {
            throw ApiException.unprocessable("El monto no puede ser cero.");
        }
        return switch (r.type()) {
            case EXPENSE -> {
                requirePositive(value);
                yield value.negate();
            }
            case INCOME -> {
                requirePositive(value);
                yield value;
            }
            case ADJUSTMENT -> value;
            default -> throw ApiException.unprocessable("Las transferencias se registran con POST /transfers.");
        };
    }

    private static void requirePositive(BigDecimal value) {
        if (value.signum() < 0) {
            throw ApiException.unprocessable("Para gastos e ingresos el monto es positivo.");
        }
    }

    private void checkCategory(UUID userId, TransactionType type, UUID categoryId) {
        if (type == TransactionType.ADJUSTMENT) {
            if (categoryId != null) {
                throw ApiException.unprocessable("Los ajustes no llevan categoría.");
            }
            return;
        }
        if (categoryId == null) {
            throw ApiException.unprocessable("La categoría es obligatoria para gastos e ingresos.");
        }
        Category category = categories.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> ApiException.unprocessable("La categoría indicada no existe."));
        if (!category.getKind().equals(type.name())) {
            throw ApiException.unprocessable("La categoría no corresponde al tipo del movimiento.");
        }
    }

    private static boolean sameContent(Transaction tx, TransactionCreateRequest r, BigDecimal amount) {
        return tx.getAccountId().equals(r.accountId())
                && tx.getType() == r.type()
                && tx.getAmount().compareTo(amount) == 0
                && java.util.Objects.equals(tx.getCategoryId(), r.categoryId())
                && java.util.Objects.equals(tx.getDescription(), blankToNull(r.description()))
                && java.util.Objects.equals(tx.getNote(), blankToNull(r.note()))
                && tx.getOccurredOn().equals(r.occurredOn());
    }

    @Transactional
    public TransactionResponse voidTransaction(UUID userId, UUID id, VoidRequest request) {
        Transaction tx = transactions.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("No existe un movimiento con ese identificador."));
        if (tx.getTransferId() != null) {
            throw ApiException.unprocessable("Los movimientos de transferencia se anulan anulando la transferencia.");
        }
        if (tx.isVoided()) {
            throw ApiException.unprocessable("El movimiento ya está anulado.");
        }
        if (request.version() != tx.getVersion()) {
            throw ApiException.conflict("VERSION_CONFLICT",
                    "El recurso fue modificado. La versión actual es " + tx.getVersion() + ".");
        }
        TransactionResponse before = toResponse(tx);
        tx.voidWith(blankToNull(request.reason()), Instant.now());
        transactions.saveAndFlush(tx);
        TransactionResponse after = toResponse(tx);
        audit.record(userId, "transactions", tx.getId(), "VOID", before, after);
        return after;
    }

    /** Listado keyset: occurred_on desc, id desc. Sin anulados salvo que se pida includeVoided. */
    @Transactional(readOnly = true)
    public TransactionPage list(UUID userId, LocalDate from, LocalDate to, UUID accountId, UUID categoryId,
                                List<TransactionType> types, String q, boolean includeVoided,
                                Integer limit, String cursor) {
        int pageSize = limit == null ? DEFAULT_LIMIT : Math.min(Math.max(limit, 1), MAX_LIMIT);
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Transaction> query = cb.createQuery(Transaction.class);
        Root<Transaction> t = query.from(Transaction.class);

        List<Predicate> where = new java.util.ArrayList<>();
        where.add(cb.equal(t.get("userId"), userId));
        if (!includeVoided) where.add(cb.isNull(t.get("voidedAt")));
        if (from != null) where.add(cb.greaterThanOrEqualTo(t.get("occurredOn"), from));
        if (to != null) where.add(cb.lessThanOrEqualTo(t.get("occurredOn"), to));
        if (accountId != null) where.add(cb.equal(t.get("accountId"), accountId));
        if (types != null && !types.isEmpty()) where.add(t.get("type").in(types));
        if (categoryId != null) {
            // La categoría incluye sus subcategorías.
            var sub = query.subquery(UUID.class);
            var c = sub.from(Category.class);
            sub.select(c.get("id")).where(cb.or(cb.equal(c.get("id"), categoryId), cb.equal(c.get("parentId"), categoryId)));
            where.add(t.get("categoryId").in(sub));
        }
        if (q != null && !q.isBlank()) {
            String pattern = "%" + q.trim().toLowerCase(java.util.Locale.ROOT) + "%";
            where.add(cb.or(
                    cb.like(cb.lower(t.get("description")), pattern),
                    cb.like(cb.lower(t.get("note")), pattern)));
        }
        if (cursor != null) {
            CursorPosition position = CursorPosition.decode(cursor);
            where.add(cb.or(
                    cb.lessThan(t.get("occurredOn"), position.date()),
                    cb.and(cb.equal(t.get("occurredOn"), position.date()), cb.lessThan(t.get("id"), position.id()))));
        }
        query.select(t).where(where.toArray(new Predicate[0]))
                .orderBy(cb.desc(t.get("occurredOn")), cb.desc(t.get("id")));

        List<Transaction> rows = em.createQuery(query).setMaxResults(pageSize + 1).getResultList();
        boolean hasMore = rows.size() > pageSize;
        List<Transaction> page = hasMore ? rows.subList(0, pageSize) : rows;
        String next = hasMore ? CursorPosition.of(page.get(page.size() - 1)).encode() : null;
        return new TransactionPage(page.stream().map(TransactionService::toResponse).toList(), next);
    }

    static TransactionResponse toResponse(Transaction t) {
        return new TransactionResponse(
                t.getId(), t.getAccountId(), t.getType(), MoneyFormat.toApi(t.getAmount()), t.getCategoryId(),
                t.getTransferId(), t.getDescription(), t.getNote(), t.getOccurredOn(), List.of(),
                t.getVoidedAt(), t.getVoidReason(), t.getVersion(), t.getCreatedAt(), t.getUpdatedAt());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** Posición del cursor keyset: fecha e id del último elemento de la página. */
    record CursorPosition(LocalDate date, UUID id) {
        static CursorPosition of(Transaction t) {
            return new CursorPosition(t.getOccurredOn(), t.getId());
        }

        String encode() {
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString((date + "|" + id).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        }

        static CursorPosition decode(String cursor) {
            try {
                String raw = new String(Base64.getUrlDecoder().decode(cursor), java.nio.charset.StandardCharsets.UTF_8);
                String[] parts = raw.split("\\|");
                return new CursorPosition(LocalDate.parse(parts[0]), UUID.fromString(parts[1]));
            } catch (RuntimeException ex) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Cursor inválido.");
            }
        }
    }
}
