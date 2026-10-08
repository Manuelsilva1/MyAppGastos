import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { apiRequest } from '../../lib/api';
import { IS_DEMO } from '../../lib/config';
import { useSession } from '../auth/session';

export interface NewTransaction {
  /** Generado una vez por intento de carga: un reintento usa el mismo id y no duplica. */
  id: string;
  accountId: string;
  type: 'EXPENSE' | 'INCOME';
  /** Monto positivo como string con punto, sin number. */
  amount: string;
  categoryId: string;
  occurredOn: string;
}

export interface SavedTransaction {
  id: string;
  version: number;
}

/** Alta de gasto o ingreso. Idempotente por id. En demo no guarda nada. */
export function useSaveTransaction() {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id ?? 'anon');
  return useMutation({
    mutationFn: async (input: NewTransaction): Promise<SavedTransaction> => {
      if (IS_DEMO) {
        throw new Error('Modo ejemplo: el movimiento no se guarda.');
      }
      return apiRequest<SavedTransaction>('/transactions', { method: 'POST', body: input });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      void queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      void queryClient.invalidateQueries({ queryKey: ['accounts', userId] });
    },
  });
}

export function useVoidTransaction() {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id ?? 'anon');
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      apiRequest(`/transactions/${id}/void`, { method: 'POST', body: { version, reason: 'Deshecho desde la carga rápida' } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      void queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      void queryClient.invalidateQueries({ queryKey: ['accounts', userId] });
    },
  });
}

export { randomUUID };
