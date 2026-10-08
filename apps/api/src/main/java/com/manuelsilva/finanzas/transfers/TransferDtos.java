package com.manuelsilva.finanzas.transfers;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class TransferDtos {

    private static final String MONEY = "^\\d{1,15}(\\.\\d{1,4})?$";
    private static final String RATE = "^\\d{1,11}(\\.\\d{1,8})?$";

    private TransferDtos() {
    }

    public record TransferCreateRequest(
            @NotNull UUID id,
            @NotNull UUID fromAccountId,
            @NotNull UUID toAccountId,
            @NotNull @Pattern(regexp = MONEY) String fromAmount,
            @NotNull @Pattern(regexp = MONEY) String toAmount,
            @Pattern(regexp = RATE) String exchangeRate,
            @NotNull LocalDate occurredOn,
            @Size(max = 200) String description) {
    }

    public record TransferResponse(
            UUID id,
            UUID fromAccountId,
            UUID toAccountId,
            String fromAmount,
            String toAmount,
            String exchangeRate,
            LocalDate occurredOn,
            String description,
            Instant voidedAt,
            UUID outTransactionId,
            UUID inTransactionId,
            int version,
            Instant createdAt) {
    }
}
