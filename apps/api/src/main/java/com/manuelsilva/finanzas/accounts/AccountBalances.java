package com.manuelsilva.finanzas.accounts;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Saldos derivados: initial_balance + SUM(movimientos no anulados), leídos de la vista v_account_balances. */
@Component
public class AccountBalances {

    private final JdbcTemplate jdbc;

    public AccountBalances(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<UUID, BigDecimal> forUser(UUID userId) {
        Map<UUID, BigDecimal> balances = new HashMap<>();
        jdbc.query("SELECT account_id, balance FROM v_account_balances WHERE user_id = ?",
                rs -> {
                    balances.put(rs.getObject("account_id", UUID.class), rs.getBigDecimal("balance"));
                },
                userId);
        return balances;
    }
}
