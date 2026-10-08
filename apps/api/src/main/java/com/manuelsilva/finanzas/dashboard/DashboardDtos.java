package com.manuelsilva.finanzas.dashboard;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Forma de DashboardSummary en docs/api/openapi.yaml. Montos como string. */
public final class DashboardDtos {

    private DashboardDtos() {
    }

    public record DashboardResponse(
            String month,
            String baseCurrency,
            NetWorth netWorth,
            List<MissingRate> missingRates,
            ThisMonth thisMonth,
            List<AccountItem> accounts,
            List<Upcoming> upcoming,
            List<RecentTransaction> recentTransactions) {
    }

    public record NetWorth(String amount, String currency, String changeVsPreviousMonth) {
    }

    public record MissingRate(UUID accountId, String currency) {
    }

    public record ThisMonth(String income, String expense, String net, List<TopCategory> topCategories) {
    }

    public record TopCategory(UUID categoryId, String name, String amount, String share) {
    }

    public record AccountItem(UUID id, String name, String type, String currency, String balance, String icon,
                              String color) {
    }

    public record Upcoming(UUID id, String ruleName, LocalDate dueDate, String expectedAmount, boolean overdue,
                           int daysUntil) {
    }

    public record RecentTransaction(UUID id, String description, String categoryName, String accountName,
                                    String type, String amount, String currency, LocalDate occurredOn) {
    }
}
