package com.manuelsilva.finanzas.accounts;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AccountDtos {

    private static final String MONEY = "^-?\\d{1,15}(\\.\\d{1,4})?$";

    private AccountDtos() {
    }

    public record AccountCreateRequest(
            @NotBlank @Size(max = 60) String name,
            @NotNull AccountType type,
            @NotNull @Pattern(regexp = "^[A-Z]{3}$") String currency,
            @Pattern(regexp = MONEY) String initialBalance,
            @NotNull LocalDate initialBalanceDate,
            @Size(max = 32) String color,
            @Size(max = 40) String icon,
            Boolean includeInTotal,
            @Min(-10000) @Max(10000) Integer sortOrder) {
    }

    public record AccountResponse(
            UUID id,
            String name,
            AccountType type,
            String currency,
            String initialBalance,
            LocalDate initialBalanceDate,
            String color,
            String icon,
            boolean includeInTotal,
            int sortOrder,
            Instant archivedAt,
            String balance,
            int version) {
    }

    public record AccountListResponse(List<AccountResponse> items) {
    }
}
