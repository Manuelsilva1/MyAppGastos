package com.manuelsilva.finanzas.dashboard;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.manuelsilva.finanzas.common.ApiException;
import com.manuelsilva.finanzas.common.MoneyFormat;
import com.manuelsilva.finanzas.dashboard.DashboardDtos.AccountItem;
import com.manuelsilva.finanzas.dashboard.DashboardDtos.DashboardResponse;
import com.manuelsilva.finanzas.dashboard.DashboardDtos.MissingRate;
import com.manuelsilva.finanzas.dashboard.DashboardDtos.NetWorth;
import com.manuelsilva.finanzas.dashboard.DashboardDtos.RecentTransaction;
import com.manuelsilva.finanzas.dashboard.DashboardDtos.ThisMonth;
import com.manuelsilva.finanzas.dashboard.DashboardDtos.TopCategory;
import com.manuelsilva.finanzas.dashboard.DashboardDtos.Upcoming;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resumen de inicio. Todo se calcula con SQL y BigDecimal; nunca con double.
 * Las conversiones usan la cotización más reciente con rate_date <= fecha; si no hay,
 * la cuenta o el movimiento no se suma y aparece en missingRates.
 */
@Service
public class DashboardService {

    private static final int UPCOMING_DAYS = 30;

    private final JdbcTemplate jdbc;
    private final Clock clock;

    public DashboardService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public DashboardResponse summary(UUID userId, String monthParam) {
        LocalDate today = LocalDate.now(clock);
        YearMonth month = monthParam == null ? YearMonth.from(today) : parseMonth(monthParam);
        String baseCurrency = jdbc.queryForObject("SELECT base_currency FROM users WHERE id = ?", String.class, userId);
        List<MissingRate> missing = new ArrayList<>();

        // Cuentas con saldo derivado (vista v_account_balances).
        List<AccountItem> accounts = jdbc.query("""
                SELECT a.id, a.name, a.type, a.currency, a.icon, a.color, a.include_in_total, v.balance
                  FROM accounts a
                  JOIN v_account_balances v ON v.account_id = a.id
                 WHERE a.user_id = ? AND a.archived_at IS NULL
                 ORDER BY a.sort_order, a.name""",
                (rs, i) -> new AccountItem(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("type"),
                        rs.getString("currency"), MoneyFormat.toApi(rs.getBigDecimal("balance")),
                        rs.getString("icon"), rs.getString("color")),
                userId);

        // Patrimonio: solo cuentas incluidas en el total, convertidas a la moneda base.
        BigDecimal netWorth = BigDecimal.ZERO;
        List<AccountItem> included = jdbc.query("""
                SELECT a.id, a.name, a.type, a.currency, a.icon, a.color, a.include_in_total, v.balance
                  FROM accounts a
                  JOIN v_account_balances v ON v.account_id = a.id
                 WHERE a.user_id = ? AND a.archived_at IS NULL AND a.include_in_total""",
                (rs, i) -> new AccountItem(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("type"),
                        rs.getString("currency"), rs.getBigDecimal("balance").toPlainString(), null, null),
                userId);
        for (AccountItem account : included) {
            BigDecimal balance = new BigDecimal(account.balance());
            Optional<BigDecimal> converted = convert(userId, balance, account.currency(), baseCurrency, today);
            if (converted.isPresent()) {
                netWorth = netWorth.add(converted.get());
            } else {
                missing.add(new MissingRate(account.id(), account.currency()));
            }
        }

        ThisMonth thisMonth = thisMonth(userId, month, baseCurrency, missing);

        List<Upcoming> upcoming = jdbc.query("""
                SELECT ro.id, rr.name, ro.due_date, ro.expected_amount
                  FROM recurring_occurrences ro
                  JOIN recurring_rules rr ON rr.id = ro.rule_id
                 WHERE ro.user_id = ? AND ro.status = 'PENDING' AND ro.due_date <= ?
                 ORDER BY ro.due_date
                 LIMIT 5""",
                (rs, i) -> {
                    LocalDate due = rs.getObject("due_date", LocalDate.class);
                    int days = (int) java.time.temporal.ChronoUnit.DAYS.between(today, due);
                    return new Upcoming(rs.getObject("id", UUID.class), rs.getString("name"), due,
                            MoneyFormat.toApi(rs.getBigDecimal("expected_amount")), days < 0, days);
                },
                userId, today.plusDays(UPCOMING_DAYS));

        List<RecentTransaction> recent = jdbc.query("""
                SELECT t.id, t.description, c.name AS category_name, a.name AS account_name, t.type,
                       t.amount, a.currency, t.occurred_on
                  FROM transactions t
                  JOIN accounts a ON a.id = t.account_id
                  LEFT JOIN categories c ON c.id = t.category_id
                 WHERE t.user_id = ? AND t.voided_at IS NULL
                 ORDER BY t.occurred_on DESC, t.created_at DESC, t.id DESC
                 LIMIT 5""",
                (rs, i) -> new RecentTransaction(rs.getObject("id", UUID.class), rs.getString("description"),
                        rs.getString("category_name"), rs.getString("account_name"), rs.getString("type"),
                        MoneyFormat.toApi(rs.getBigDecimal("amount")), rs.getString("currency"),
                        rs.getObject("occurred_on", LocalDate.class)),
                userId);

        return new DashboardResponse(
                month.toString(),
                baseCurrency,
                new NetWorth(MoneyFormat.toApi(netWorth), baseCurrency, null),
                missing,
                thisMonth,
                accounts,
                upcoming,
                recent);
    }

    private ThisMonth thisMonth(UUID userId, YearMonth month, String baseCurrency, List<MissingRate> missing) {
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expense = BigDecimal.ZERO;
        Map<UUID, TopCategory> byCategory = new LinkedHashMap<>();
        Map<UUID, BigDecimal> totalsByCategory = new LinkedHashMap<>();
        Map<UUID, String> namesByCategory = new LinkedHashMap<>();

        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT t.type, t.amount, t.occurred_on, a.currency, a.id AS account_id,
                       COALESCE(p.id, c.id) AS group_id, COALESCE(p.name, c.name) AS group_name
                  FROM transactions t
                  JOIN accounts a ON a.id = t.account_id
                  LEFT JOIN categories c ON c.id = t.category_id
                  LEFT JOIN categories p ON p.id = c.parent_id
                 WHERE t.user_id = ? AND t.voided_at IS NULL
                   AND t.type IN ('EXPENSE', 'INCOME')
                   AND t.occurred_on BETWEEN ? AND ?""",
                userId, month.atDay(1), month.atEndOfMonth());

        for (Map<String, Object> row : rows) {
            BigDecimal amount = (BigDecimal) row.get("amount");
            String currency = (String) row.get("currency");
            LocalDate date = (LocalDate) row.get("occurred_on");
            UUID accountId = (UUID) row.get("account_id");
            Optional<BigDecimal> converted = convert(userId, amount.abs(), currency, baseCurrency, date);
            if (converted.isEmpty()) {
                missing.add(new MissingRate(accountId, currency));
                continue;
            }
            if ("INCOME".equals(row.get("type"))) {
                income = income.add(converted.get());
            } else {
                expense = expense.add(converted.get());
                UUID groupId = (UUID) row.get("group_id");
                if (groupId != null) {
                    totalsByCategory.merge(groupId, converted.get(), BigDecimal::add);
                    namesByCategory.putIfAbsent(groupId, (String) row.get("group_name"));
                }
            }
        }

        BigDecimal totalExpense = expense;
        List<TopCategory> top = totalsByCategory.entrySet().stream()
                .sorted(Map.Entry.<UUID, BigDecimal>comparingByValue().reversed())
                .limit(3)
                .map(e -> new TopCategory(e.getKey(), namesByCategory.get(e.getKey()),
                        MoneyFormat.toApi(e.getValue()), share(e.getValue(), totalExpense)))
                .toList();
        return new ThisMonth(MoneyFormat.toApi(income), MoneyFormat.toApi(expense),
                MoneyFormat.toApi(income.subtract(expense)), top);
    }

    /** Proporción 0..1 con 4 decimales, como string. */
    static String share(BigDecimal part, BigDecimal total) {
        if (total.signum() == 0) {
            return "0.0000";
        }
        return part.divide(total, 4, RoundingMode.HALF_UP).toPlainString();
    }

    /** Convierte usando la cotización más reciente con rate_date <= date. Vacío si no hay cotización. */
    Optional<BigDecimal> convert(UUID userId, BigDecimal amount, String from, String to, LocalDate date) {
        if (from.equals(to)) {
            return Optional.of(amount);
        }
        List<BigDecimal> rates = jdbc.query("""
                SELECT rate FROM exchange_rates
                 WHERE user_id = ? AND from_currency = ? AND to_currency = ? AND rate_date <= ?
                 ORDER BY rate_date DESC LIMIT 1""",
                (rs, i) -> rs.getBigDecimal("rate"), userId, from, to, date);
        if (rates.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(amount.multiply(rates.get(0)).setScale(4, RoundingMode.HALF_UP));
    }

    private static YearMonth parseMonth(String value) {
        try {
            return YearMonth.parse(value);
        } catch (RuntimeException ex) {
            throw ApiException.unprocessable("El mes debe tener el formato AAAA-MM.");
        }
    }
}
