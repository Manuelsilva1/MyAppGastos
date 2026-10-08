/** URL de la API y modo demo. Sin EXPO_PUBLIC_API_URL la app usa datos de ejemplo. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
export const API_BASE = `${API_URL}/api/v1`;
export const IS_DEMO = process.env.EXPO_PUBLIC_DEMO === 'true' || API_URL === '';
