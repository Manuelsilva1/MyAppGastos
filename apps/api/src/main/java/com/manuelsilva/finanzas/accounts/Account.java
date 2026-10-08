package com.manuelsilva.finanzas.accounts;

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

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType type;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "initial_balance", nullable = false, precision = 19, scale = 4)
    private BigDecimal initialBalance;

    @Column(name = "initial_balance_date", nullable = false)
    private LocalDate initialBalanceDate;

    private String color;

    private String icon;

    @Column(name = "include_in_total", nullable = false)
    private boolean includeInTotal;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @Version
    private int version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Account() {
    }

    public Account(UUID userId, String name, AccountType type, String currency, BigDecimal initialBalance,
                   LocalDate initialBalanceDate, String color, String icon, boolean includeInTotal, int sortOrder) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.name = name;
        this.type = type;
        this.currency = currency;
        this.initialBalance = initialBalance;
        this.initialBalanceDate = initialBalanceDate;
        this.color = color;
        this.icon = icon;
        this.includeInTotal = includeInTotal;
        this.sortOrder = sortOrder;
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

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getName() { return name; }
    public AccountType getType() { return type; }
    public String getCurrency() { return currency; }
    public BigDecimal getInitialBalance() { return initialBalance; }
    public LocalDate getInitialBalanceDate() { return initialBalanceDate; }
    public String getColor() { return color; }
    public String getIcon() { return icon; }
    public boolean isIncludeInTotal() { return includeInTotal; }
    public int getSortOrder() { return sortOrder; }
    public Instant getArchivedAt() { return archivedAt; }
    public int getVersion() { return version; }
}
