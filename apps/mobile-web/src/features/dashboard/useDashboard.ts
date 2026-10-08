import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { IS_DEMO } from '../../lib/config';
import { useSession } from '../auth/session';
import { SAMPLE_DASHBOARD } from './sample';
import type { DashboardSummary } from './types';

/** Resumen de inicio. Con API configurada usa el endpoint real; sin API, datos de ejemplo. */
export function useDashboard() {
  const userId = useSession((s) => s.user?.id ?? 'anon');
  return useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => (IS_DEMO ? Promise.resolve(SAMPLE_DASHBOARD) : apiRequest<DashboardSummary>('/dashboard')),
  });
}
