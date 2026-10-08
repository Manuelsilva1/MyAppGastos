import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { IS_DEMO } from '../../lib/config';
import { useSession } from '../auth/session';

export interface TransactionItem {
  id: string;
  accountId: string;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT';
  amount: string;
  categoryId: string | null;
  description: string | null;
  occurredOn: string;
  version: number;
}

interface Page {
  items: TransactionItem[];
  nextCursor: string | null;
}

/** Listado keyset con scroll infinito. En demo no hay movimientos guardados. */
export function useTransactions() {
  const userId = useSession((s) => s.user?.id ?? 'anon');
  return useInfiniteQuery({
    queryKey: ['transactions', userId],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<Page> => {
      if (IS_DEMO) return { items: [], nextCursor: null };
      const query = new URLSearchParams({ limit: '30' });
      if (pageParam) query.set('cursor', pageParam);
      return apiRequest<Page>(`/transactions?${query.toString()}`);
    },
    getNextPageParam: (last) => last.nextCursor,
  });
}
