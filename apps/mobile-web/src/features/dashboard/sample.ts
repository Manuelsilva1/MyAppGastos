import type { DashboardSummary } from './types';

/**
 * Datos de ejemplo para revisar el diseño sin API (EXPO_PUBLIC_DEMO=true).
 * La pantalla muestra un aviso cuando está activo.
 */
export const SAMPLE_DASHBOARD: DashboardSummary = {
  month: '2026-10',
  baseCurrency: 'UYU',
  netWorth: { amount: '152340.5000', currency: 'UYU', changeVsPreviousMonth: '4.2' },
  missingRates: [],
  thisMonth: {
    income: '32000.0000',
    expense: '18450.5000',
    net: '13549.5000',
    topCategories: [
      { categoryId: '1', name: 'Supermercado', amount: '6200.0000', share: '0.3361' },
      { categoryId: '2', name: 'Comida afuera', amount: '4100.0000', share: '0.2222' },
      { categoryId: '3', name: 'Transporte', amount: '2050.5000', share: '0.1111' },
    ],
  },
  accounts: [
    { id: 'a1', name: 'Santander', type: 'BANK', currency: 'UYU', balance: '120000.0000', icon: 'landmark', color: 'azul-03' },
    { id: 'a2', name: 'Efectivo', type: 'CASH', currency: 'UYU', balance: '8450.5000', icon: 'wallet', color: 'azul-06' },
    { id: 'a3', name: 'Mercado Pago', type: 'WALLET', currency: 'UYU', balance: '23890.0000', icon: 'smartphone', color: 'azul-09' },
    { id: 'a4', name: 'Ahorro USD', type: 'SAVINGS', currency: 'USD', balance: '1200.0000', icon: 'piggy-bank', color: 'azul-01' },
  ],
  upcoming: [
    { id: 'u1', ruleName: 'Alquiler', dueDate: '2026-10-11', expectedAmount: '28000.0000', overdue: false, daysUntil: 3 },
    { id: 'u2', ruleName: 'Internet', dueDate: '2026-10-09', expectedAmount: '1890.0000', overdue: false, daysUntil: 1 },
    { id: 'u3', ruleName: 'Seguro del auto', dueDate: '2026-10-06', expectedAmount: '4300.0000', overdue: true, daysUntil: -2 },
  ],
  recentTransactions: [
    { id: 't1', description: 'Tienda Inglesa', categoryName: 'Supermercado', accountName: 'Santander', type: 'EXPENSE', amount: '-450.0000', currency: 'UYU', occurredOn: '2026-10-07' },
    { id: 't2', description: 'Sueldo octubre', categoryName: 'Sueldo', accountName: 'Santander', type: 'INCOME', amount: '32000.0000', currency: 'UYU', occurredOn: '2026-10-01' },
    { id: 't3', description: 'Pasé a efectivo', categoryName: null, accountName: 'Santander', type: 'TRANSFER_OUT', amount: '-5000.0000', currency: 'UYU', occurredOn: '2026-10-05' },
    { id: 't4', description: 'Nafta', categoryName: 'Combustible', accountName: 'Mercado Pago', type: 'EXPENSE', amount: '-2100.0000', currency: 'UYU', occurredOn: '2026-10-04' },
  ],
};
