/** Forma del resumen de inicio (DashboardSummary en docs/api/openapi.yaml). Montos como string. */
export interface DashboardSummary {
  month: string;
  baseCurrency: string;
  netWorth: { amount: string; currency: string; changeVsPreviousMonth: string | null };
  missingRates: { accountId: string; currency: string }[];
  thisMonth: {
    income: string;
    expense: string;
    net: string;
    topCategories: { categoryId: string; name: string; amount: string; share: string }[];
  };
  accounts: DashboardAccount[];
  upcoming: { id: string; ruleName: string; dueDate: string; expectedAmount: string; overdue: boolean; daysUntil: number }[];
  recentTransactions: { id: string; description: string | null; categoryName: string | null; accountName: string;
    type: 'EXPENSE' | 'INCOME' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT'; amount: string; currency: string;
    occurredOn: string }[];
}

export interface DashboardAccount {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT_CARD' | 'WALLET' | 'SAVINGS';
  currency: string;
  balance: string;
  icon: string | null;
  color: string | null;
}
