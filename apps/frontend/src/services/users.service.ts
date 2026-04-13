import { api } from '@/lib/api';
import type {
  TenantUser,
  TenantUserDetail,
  CreateUserInput,
  UpdateUserInput,
} from '@/types';

export const usersService = {
  listAll: () => api.get<TenantUser[]>('/users').then((r) => r.data),

  listActive: () =>
    api
      .get<Pick<TenantUser, 'id' | 'name' | 'email' | 'role' | 'avatarUrl'>[]>('/users/active')
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<TenantUserDetail>(`/users/${id}`).then((r) => r.data),

  create: (data: CreateUserInput) =>
    api.post<TenantUser>('/users', data).then((r) => r.data),

  update: (id: string, data: UpdateUserInput) =>
    api.patch<TenantUser>(`/users/${id}`, data).then((r) => r.data),

  changePassword: (id: string, newPassword: string) =>
    api
      .patch<{ message: string }>(`/users/${id}/password`, { newPassword })
      .then((r) => r.data),

  deactivate: (id: string) =>
    api.delete<{ message: string }>(`/users/${id}`).then((r) => r.data),
};
