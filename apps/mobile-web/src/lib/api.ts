import { API_BASE } from './config';
import { useSession } from '../features/auth/session';

/** Error de la API con el código estable del Problem Details (RFC 7807). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly errors: { field: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT';
  body?: unknown;
  /** Si es false, no se manda el token (login, registro). */
  auth?: boolean;
}

async function parseError(response: Response): Promise<ApiError> {
  let problem: { code?: string; detail?: string; errors?: { field: string; message: string }[] } = {};
  try {
    problem = await response.json();
  } catch {
    // Respuesta sin cuerpo JSON.
  }
  return new ApiError(response.status, problem.code ?? 'INTERNAL_ERROR',
    problem.detail ?? `Error ${response.status}`, problem.errors ?? []);
}

/** Un solo intento de refresh por llamada: si falla, se cierra la sesión. */
async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken, user, setTokens, signOut } = useSession.getState();
  if (!refreshToken) return false;
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    signOut();
    return false;
  }
  const data = (await response.json()) as { accessToken: string; refreshToken: string; user: unknown };
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: (data.user as typeof user) ?? user ?? undefined });
  return true;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const send = () => {
    const token = useSession.getState().accessToken;
    return fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let response = await send();
  if (response.status === 401 && auth && (await refreshAccessToken())) {
    response = await send();
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
