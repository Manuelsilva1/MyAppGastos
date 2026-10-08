import { create } from 'zustand';
import { clearSession, readSession, writeSession } from '../../lib/storage';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  baseCurrency: string;
  locale: string;
}

export interface SessionState {
  ready: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  /** Carga la sesión guardada al iniciar la app. */
  hydrate: () => Promise<void>;
  setTokens: (tokens: { accessToken: string; refreshToken: string; user?: SessionUser }) => void;
  signOut: () => void;
}

interface Stored {
  accessToken: string;
  refreshToken: string;
  user: SessionUser | null;
}

export const useSession = create<SessionState>((set, get) => ({
  ready: false,
  accessToken: null,
  refreshToken: null,
  user: null,

  hydrate: async () => {
    const raw = await readSession();
    if (raw) {
      try {
        const stored = JSON.parse(raw) as Stored;
        set({ accessToken: stored.accessToken, refreshToken: stored.refreshToken, user: stored.user });
      } catch {
        await clearSession();
      }
    }
    set({ ready: true });
  },

  setTokens: ({ accessToken, refreshToken, user }) => {
    const currentUser = user ?? get().user;
    set({ accessToken, refreshToken, user: currentUser });
    const stored: Stored = { accessToken, refreshToken, user: currentUser };
    void writeSession(JSON.stringify(stored));
  },

  signOut: () => {
    set({ accessToken: null, refreshToken: null, user: null });
    void clearSession();
  },
}));
