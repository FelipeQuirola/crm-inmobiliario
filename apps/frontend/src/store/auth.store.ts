import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'VENDEDOR';
  tenantId: string;
  avatarUrl?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  clearAuth: () => void;
  updateAccessToken: (accessToken: string) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user, isAuthenticated: true }),

      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),

      updateAccessToken: (accessToken) => set({ accessToken }),

      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
    }),
    {
      name: 'crm-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
