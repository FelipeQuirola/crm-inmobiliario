import { api } from '@/lib/api';
import type { AuthResponse, AuthUser } from '@/types';

export const authService = {
  login: (email: string, password: string, tenantSlug: string) =>
    api.post<AuthResponse>('/auth/login', { email, password, tenantSlug }),

  logout: () => api.post<void>('/auth/logout'),

  getMe: () => api.get<AuthUser & { tenant: { id: string; name: string; slug: string } }>('/auth/me'),
};
