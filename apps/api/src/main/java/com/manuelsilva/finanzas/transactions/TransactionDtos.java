package com.manuelsilva.finanzas.transactions;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class TransactionDtos {

    private static final String MONEY = "^-?\\d{1,15}(\\.\\d{1,4})?$";

    private TransactionDtos() {
    }

    /** Alta de gasto, ingreso o ajuste. En gastos e ingresos el monto va positivo; el servidor pone el signo. */
    public record TransactionCreateRequest(
            @NotNull UUID id,
            @NotNull UUID accountId,
            @NotNull TransactionType type,
            @NotNull @Pattern(regexp = MONEY) String amount,
            UUID categoryId,
            @Size(max = 200) String description,
            @Size(max = 2000) String note,
            @NotNull LocalDate occurredOn) {
    }

    public record VoidRequest(@NotNull @Max(1000000) Integer version, @Size(max = 200) String reason) {
    }

    public record TransactionResponse(
            UUID id,
            UUID accountId,
            TransactionType type,
            String amount,
            UUID categoryId,
            UUID transferId,
            String description,
            String note,
            LocalDate occurredOn,
            List<UUID> tagIds,
            Instant voidedAt,
            String voidReason,
            int version,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record TransactionPage(List<TransactionResponse> items, String nextCursor) {
    }
}
