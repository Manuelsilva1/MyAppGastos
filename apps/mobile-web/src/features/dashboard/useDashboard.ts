import { useQuery } from '@tanstack/react-query';
import { SAMPLE_DASHBOARD } from './sample';
import type { DashboardSummary } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
// Sin API configurada (por ejemplo, en el deploy de prueba) se muestran datos de ejemplo.
const DEMO = process.env.EXPO_PUBLIC_DEMO === 'true' || API_URL === '';

async function fetchDashboard(): Promise<DashboardSummary> {
  if (DEMO) {
    return SAMPLE_DASHBOARD;
  }
  // La autenticación (token en secure store) llega con el módulo de auth de la app.
  const response = await fetch(`${API_URL}/api/v1/dashboard`);
  if (!response.ok) {
    throw new Error(`Error ${response.status} al cargar el resumen.`);
  }
  return (await response.json()) as DashboardSummary;
}

export function useDashboard() {
  return useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });
}

export const isDemoMode = DEMO;
