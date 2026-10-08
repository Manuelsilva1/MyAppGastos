package com.manuelsilva.finanzas.currencies;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "currencies")
public class Currency {

    @Id
    @Column(length = 3)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false)
    private short decimals;

    protected Currency() {
    }

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getSymbol() { return symbol; }
    public short getDecimals() { return decimals; }
}
