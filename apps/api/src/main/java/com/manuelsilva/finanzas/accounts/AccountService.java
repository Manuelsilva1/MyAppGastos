package com.manuelsilva.finanzas.accounts;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.manuelsilva.finanzas.accounts.AccountDtos.AccountCreateRequest;
import com.manuelsilva.finanzas.accounts.AccountDtos.AccountListResponse;
import com.manuelsilva.finanzas.accounts.AccountDtos.AccountResponse;
import com.manuelsilva.finanzas.common.ApiException;
import com.manuelsilva.finanzas.common.AuditLog;
import com.manuelsilva.finanzas.common.MoneyFormat;
import com.manuelsilva.finanzas.currencies.CurrencyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    private final AccountRepository accounts;
    private final AccountBalances balances;
    private final CurrencyRepository currencies;
    private final AuditLog audit;

    public AccountService(AccountRepository accounts, AccountBalances balances,
                          CurrencyRepository currencies, AuditLog audit) {
        this.accounts = accounts;
        this.balances = balances;
        this.currencies = currencies;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public AccountListResponse list(UUID userId, boolean includeArchived) {
        Map<UUID, BigDecimal> saldos = balances.forUser(userId);
        List<AccountResponse> items = accounts.findByUserIdOrderBySortOrderAscNameAsc(userId).stream()
                .filter(a -> includeArchived || a.getArchivedAt() == null)
                .map(a -> toResponse(a, saldos))
                .toList();
        return new AccountListResponse(items);
    }

    @Transactional(readOnly = true)
    public AccountResponse get(UUID userId, UUID id) {
        Account account = accounts.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("No existe una cuenta con ese identificador."));
        return toResponse(account, balances.forUser(userId));
    }

    @Transactional
    public AccountResponse create(UUID userId, AccountCreateRequest request) {
        if (!currencies.existsById(request.currency())) {
            throw ApiException.unprocessable("La moneda " + request.currency() + " no está soportada.");
        }
        if (accounts.existsByUserIdAndNameAndArchivedAtIsNull(userId, request.name())) {
            throw ApiException.conflict("DUPLICATE_NAME", "Ya existe una cuenta con ese nombre.");
        }
        BigDecimal initial = MoneyFormat.parse(request.initialBalance() == null ? "0" : request.initialBalance());
        Account account = accounts.saveAndFlush(new Account(
                userId,
                request.name().trim(),
                request.type(),
                request.currency(),
                initial,
                request.initialBalanceDate(),
                request.color(),
                request.icon(),
                request.includeInTotal() == null || request.includeInTotal(),
                request.sortOrder() == null ? 0 : request.sortOrder()));
        AccountResponse response = toResponse(account, balances.forUser(userId));
        audit.record(userId, "accounts", account.getId(), "CREATE", null, response);
        return response;
    }

    static AccountResponse toResponse(Account a, Map<UUID, BigDecimal> saldos) {
        BigDecimal balance = saldos.getOrDefault(a.getId(), a.getInitialBalance());
        return new AccountResponse(
                a.getId(),
                a.getName(),
                a.getType(),
                a.getCurrency(),
                MoneyFormat.toApi(a.getInitialBalance()),
                a.getInitialBalanceDate(),
                a.getColor(),
                a.getIcon(),
                a.isIncludeInTotal(),
                a.getSortOrder(),
                a.getArchivedAt(),
                MoneyFormat.toApi(balance),
                a.getVersion());
    }
}
