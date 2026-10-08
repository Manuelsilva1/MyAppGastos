package com.manuelsilva.finanzas.categories;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String kind;

    private String color;

    private String icon;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Category() {
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getParentId() { return parentId; }
    public String getName() { return name; }
    public String getKind() { return kind; }
    public String getColor() { return color; }
    public String getIcon() { return icon; }
    public int getSortOrder() { return sortOrder; }
    public Instant getArchivedAt() { return archivedAt; }
}
