package com.manuelsilva.finanzas.transactions;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/** Movimiento. El id lo genera el cliente (clave de idempotencia). Los montos van con signo. */
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "transfer_id")
    private UUID transferId;

    private String description;

    private String note;

    @Column(name = "occurred_on", nullable = false)
    private LocalDate occurredOn;

    @Column(name = "voided_at")
    private Instant voidedAt;

    @Column(name = "void_reason")
    private String voidReason;

    @Version
    private int version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Transaction() {
    }

    public Transaction(UUID id, UUID userId, UUID accountId, TransactionType type, BigDecimal amount,
                       UUID categoryId, UUID transferId, String description, String note, LocalDate occurredOn) {
        this.id = id;
        this.userId = userId;
        this.accountId = accountId;
        this.type = type;
        this.amount = amount;
        this.categoryId = categoryId;
        this.transferId = transferId;
        this.description = description;
        this.note = note;
        this.occurredOn = occurredOn;
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

    public void voidWith(String reason, Instant at) {
        this.voidedAt = at;
        this.voidReason = reason;
    }

    public boolean isVoided() { return voidedAt != null; }
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getAccountId() { return accountId; }
    public TransactionType getType() { return type; }
    public BigDecimal getAmount() { return amount; }
    public UUID getCategoryId() { return categoryId; }
    public UUID getTransferId() { return transferId; }
    public String getDescription() { return description; }
    public String getNote() { return note; }
    public LocalDate getOccurredOn() { return occurredOn; }
    public Instant getVoidedAt() { return voidedAt; }
    public String getVoidReason() { return voidReason; }
    public int getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
