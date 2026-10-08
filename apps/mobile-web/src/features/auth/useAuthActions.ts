import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useSession, type SessionUser } from './session';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

/** Login y registro: guardan la sesión y devuelven el usuario. */
export function useAuthActions() {
  const setTokens = useSession((s) => s.setTokens);
  const login = useMutation({
    mutationFn: (input: LoginInput) =>
      apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input, auth: false }),
    onSuccess: (data) => setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }),
  });
  const register = useMutation({
    mutationFn: (input: RegisterInput) =>
      apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: { ...input, baseCurrency: 'UYU', locale: 'es-UY' }, auth: false }),
    onSuccess: (data) => setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }),
  });
  return { login, register };
}
