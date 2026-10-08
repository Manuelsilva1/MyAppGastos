package com.manuelsilva.finanzas.transfers;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/** Cabecera de la transferencia. Sus dos movimientos (TRANSFER_OUT y TRANSFER_IN) viven en transactions. */
@Entity
@Table(name = "transfers")
public class Transfer {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "from_account_id", nullable = false)
    private UUID fromAccountId;

    @Column(name = "to_account_id", nullable = false)
    private UUID toAccountId;

    @Column(name = "from_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal fromAmount;

    @Column(name = "to_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal toAmount;

    @Column(name = "exchange_rate", precision = 19, scale = 8)
    private BigDecimal exchangeRate;

    @Column(name = "occurred_on", nullable = false)
    private LocalDate occurredOn;

    private String description;

    @Column(name = "voided_at")
    private Instant voidedAt;

    @Version
    private int version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Transfer() {
    }

    public Transfer(UUID id, UUID userId, UUID fromAccountId, UUID toAccountId, BigDecimal fromAmount,
                    BigDecimal toAmount, BigDecimal exchangeRate, LocalDate occurredOn, String description) {
        this.id = id;
        this.userId = userId;
        this.fromAccountId = fromAccountId;
        this.toAccountId = toAccountId;
        this.fromAmount = fromAmount;
        this.toAmount = toAmount;
        this.exchangeRate = exchangeRate;
        this.occurredOn = occurredOn;
        this.description = description;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void voidNow(Instant at) {
        this.voidedAt = at;
    }

    public boolean isVoided() { return voidedAt != null; }
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getFromAccountId() { return fromAccountId; }
    public UUID getToAccountId() { return toAccountId; }
    public BigDecimal getFromAmount() { return fromAmount; }
    public BigDecimal getToAmount() { return toAmount; }
    public BigDecimal getExchangeRate() { return exchangeRate; }
    public LocalDate getOccurredOn() { return occurredOn; }
    public String getDescription() { return description; }
    public Instant getVoidedAt() { return voidedAt; }
    public int getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
}
