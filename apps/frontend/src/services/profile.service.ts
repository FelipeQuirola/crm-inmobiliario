import { api as apiClient } from '@/lib/api';
import type { UserProfile, UpdateProfileInput, ChangePasswordInput } from '@/types';

export const profileService = {
  getProfile: (): Promise<UserProfile> =>
    apiClient.get('/users/profile').then((r) => r.data),

  updateProfile: (data: UpdateProfileInput): Promise<UserProfile> =>
    apiClient.patch('/users/profile', data).then((r) => r.data),

  changePassword: (data: ChangePasswordInput): Promise<{ message: string }> =>
    apiClient.patch('/users/profile/password', data).then((r) => r.data),

  uploadAvatar: (file: File): Promise<{ avatarUrl: string }> => {
    const form = new FormData();
    form.append('avatar', file);
    return apiClient
      .post('/users/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
