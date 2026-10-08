package com.manuelsilva.finanzas.transfers;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import com.manuelsilva.finanzas.accounts.Account;
import com.manuelsilva.finanzas.accounts.AccountRepository;
import com.manuelsilva.finanzas.common.ApiException;
import com.manuelsilva.finanzas.common.AuditLog;
import com.manuelsilva.finanzas.common.MoneyFormat;
import com.manuelsilva.finanzas.transactions.Transaction;
import com.manuelsilva.finanzas.transactions.TransactionRepository;
import com.manuelsilva.finanzas.transactions.TransactionType;
import com.manuelsilva.finanzas.transfers.TransferDtos.TransferCreateRequest;
import com.manuelsilva.finanzas.transfers.TransferDtos.TransferResponse;
import com.manuelsilva.finanzas.transactions.TransactionDtos.VoidRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Transferencias entre cuentas propias. La cabecera y los dos movimientos se crean y anulan en una
 * sola transacción de base de datos: si algo falla, no queda nada a medias. La base revalida que
 * cada transferencia tenga exactamente una salida y una entrada que coincidan (trigger diferido).
 */
@Service
public class TransferService {

    private final TransferRepository transfers;
    private final TransactionRepository transactions;
    private final AccountRepository accounts;
    private final AuditLog audit;

    public TransferService(TransferRepository transfers, TransactionRepository transactions,
                           AccountRepository accounts, AuditLog audit) {
        this.transfers = transfers;
        this.transactions = transactions;
        this.accounts = accounts;
        this.audit = audit;
    }

    public record CreateResult(TransferResponse transfer, boolean created) {
    }

    @Transactional
    public CreateResult create(UUID userId, TransferCreateRequest r) {
        BigDecimal fromAmount = MoneyFormat.parse(r.fromAmount());
        BigDecimal toAmount = MoneyFormat.parse(r.toAmount());
        BigDecimal rate = r.exchangeRate() == null ? null : new BigDecimal(r.exchangeRate());

        var existing = transfers.findById(r.id());
        if (existing.isPresent()) {
            Transfer t = existing.get();
            if (!t.getUserId().equals(userId) || !sameContent(t, r, fromAmount, toAmount, rate)) {
                throw ApiException.conflict("ID_REUSED_WITH_DIFFERENT_PAYLOAD",
                        "Ya existe una transferencia con ese id y datos distintos.");
            }
            return new CreateResult(toResponse(t), false);
        }

        if (fromAmount.signum() <= 0 || toAmount.signum() <= 0) {
            throw ApiException.unprocessable("Los montos de la transferencia deben ser mayores que cero.");
        }
        if (r.fromAccountId().equals(r.toAccountId())) {
            throw ApiException.unprocessable("Elegí una cuenta distinta a la de origen.");
        }
        Account from = activeAccount(userId, r.fromAccountId());
        Account to = activeAccount(userId, r.toAccountId());

        if (from.getCurrency().equals(to.getCurrency())) {
            if (rate != null) {
                throw ApiException.unprocessable("Entre cuentas de la misma moneda no se usa tipo de cambio.");
            }
            if (fromAmount.compareTo(toAmount) != 0) {
                throw ApiException.unprocessable("En la misma moneda, el monto de destino es igual al de origen.");
            }
        } else if (rate == null) {
            throw ApiException.unprocessable("Entre cuentas de distinta moneda el tipo de cambio es obligatorio.");
        }

        Transfer transfer = transfers.saveAndFlush(new Transfer(r.id(), userId, from.getId(), to.getId(),
                fromAmount, toAmount, rate, r.occurredOn(), blankToNull(r.description())));
        Transaction out = transactions.saveAndFlush(new Transaction(UUID.randomUUID(), userId, from.getId(),
                TransactionType.TRANSFER_OUT, fromAmount.negate(), null, transfer.getId(),
                blankToNull(r.description()), null, r.occurredOn()));
        Transaction in = transactions.saveAndFlush(new Transaction(UUID.randomUUID(), userId, to.getId(),
                TransactionType.TRANSFER_IN, toAmount, null, transfer.getId(),
                blankToNull(r.description()), null, r.occurredOn()));

        TransferResponse response = toResponse(transfer, out.getId(), in.getId());
        audit.record(userId, "transfers", transfer.getId(), "CREATE", null, response);
        return new CreateResult(response, true);
    }

    @Transactional
    public TransferResponse voidTransfer(UUID userId, UUID id, VoidRequest request) {
        Transfer transfer = transfers.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("No existe una transferencia con ese identificador."));
        if (transfer.isVoided()) {
            throw ApiException.unprocessable("La transferencia ya está anulada.");
        }
        if (request.version() != transfer.getVersion()) {
            throw ApiException.conflict("VERSION_CONFLICT",
                    "El recurso fue modificado. La versión actual es " + transfer.getVersion() + ".");
        }
        TransferResponse before = toResponse(transfer);
        Instant now = Instant.now();
        transfer.voidNow(now);
        transfers.saveAndFlush(transfer);
        transactions.findByTransferId(id).forEach(leg -> {
            leg.voidWith(request.reason() == null ? "Anulación de transferencia" : request.reason(), now);
            transactions.saveAndFlush(leg);
        });
        TransferResponse after = toResponse(transfer);
        audit.record(userId, "transfers", id, "VOID", before, after);
        return after;
    }

    private Account activeAccount(UUID userId, UUID accountId) {
        Account account = accounts.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> ApiException.unprocessable("Una de las cuentas indicadas no existe."));
        if (account.getArchivedAt() != null) {
            throw ApiException.unprocessable("La cuenta " + account.getName() + " está archivada.");
        }
        return account;
    }

    private static boolean sameContent(Transfer t, TransferCreateRequest r, BigDecimal fromAmount,
                                       BigDecimal toAmount, BigDecimal rate) {
        return t.getFromAccountId().equals(r.fromAccountId())
                && t.getToAccountId().equals(r.toAccountId())
                && t.getFromAmount().compareTo(fromAmount) == 0
                && t.getToAmount().compareTo(toAmount) == 0
                && Objects.equals(t.getExchangeRate() == null ? null : t.getExchangeRate().stripTrailingZeros(),
                        rate == null ? null : rate.stripTrailingZeros())
                && t.getOccurredOn().equals(r.occurredOn());
    }

    private TransferResponse toResponse(Transfer t) {
        List<Transaction> legs = transactions.findByTransferId(t.getId());
        UUID out = legs.stream().filter(x -> x.getType() == TransactionType.TRANSFER_OUT).map(Transaction::getId).findFirst().orElse(null);
        UUID in = legs.stream().filter(x -> x.getType() == TransactionType.TRANSFER_IN).map(Transaction::getId).findFirst().orElse(null);
        return toResponse(t, out, in);
    }

    static TransferResponse toResponse(Transfer t, UUID out, UUID in) {
        return new TransferResponse(
                t.getId(), t.getFromAccountId(), t.getToAccountId(),
                MoneyFormat.toApi(t.getFromAmount()), MoneyFormat.toApi(t.getToAmount()),
                t.getExchangeRate() == null ? null : t.getExchangeRate().setScale(8).toPlainString(),
                t.getOccurredOn(), t.getDescription(), t.getVoidedAt(), out, in, t.getVersion(), t.getCreatedAt());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
