import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { IS_DEMO } from '../../lib/config';
import { useSession } from '../auth/session';
import { SAMPLE_DASHBOARD } from '../dashboard/sample';

export interface AccountOption {
  id: string;
  name: string;
  currency: string;
  balance: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  kind: 'EXPENSE' | 'INCOME';
  icon: string | null;
  color: string | null;
}

interface AccountsResponse {
  items: { id: string; name: string; currency: string; balance: string; archivedAt: string | null }[];
}

interface CategoriesResponse {
  items: { id: string; parentId: string | null; name: string; kind: 'EXPENSE' | 'INCOME'; icon: string | null; color: string | null }[];
}

/** Cuentas activas del usuario (con saldo derivado). */
export function useAccounts() {
  const userId = useSession((s) => s.user?.id ?? 'anon');
  return useQuery({
    queryKey: ['accounts', userId],
    queryFn: async (): Promise<AccountOption[]> => {
      if (IS_DEMO) {
        return SAMPLE_DASHBOARD.accounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency, balance: a.balance }));
      }
      const data = await apiRequest<AccountsResponse>('/accounts');
      return data.items.filter((a) => a.archivedAt === null);
    },
  });
}

/** Categorías del tipo indicado. Las de primer nivel son las que se muestran en la carga rápida. */
export function useCategories(kind: 'EXPENSE' | 'INCOME') {
  const userId = useSession((s) => s.user?.id ?? 'anon');
  return useQuery({
    queryKey: ['categories', userId, kind],
    queryFn: async (): Promise<CategoryOption[]> => {
      if (IS_DEMO) {
        return kind !== 'EXPENSE'
          ? []
          : SAMPLE_DASHBOARD.thisMonth.topCategories.map((c) => ({
              id: c.categoryId, name: c.name, kind: 'EXPENSE' as const, icon: null, color: null,
            }));
      }
      const data = await apiRequest<CategoriesResponse>(`/categories?kind=${kind}`);
      return data.items.filter((c) => c.parentId === null);
    },
  });
}
