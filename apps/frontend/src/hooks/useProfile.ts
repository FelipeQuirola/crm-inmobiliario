import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/store/auth.store';
import type { UpdateProfileInput, ChangePasswordInput } from '@/types';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => profileService.updateProfile(data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      updateUser({ name: updated.name, email: updated.email });
    },
  });
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordInput) => profileService.changePassword(data),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      updateUser({ avatarUrl: data.avatarUrl });
    },
  });
}
