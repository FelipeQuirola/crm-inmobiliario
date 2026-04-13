import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import type { ApiErrorResponse } from '@/types';
import axios from 'axios';

const TENANT_SLUG =
  import.meta.env.VITE_TENANT_SLUG as string | undefined ?? 'homematch';

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password, TENANT_SLUG),
    onSuccess: ({ data }) => {
      setTokens(data.accessToken, data.refreshToken, data.user);
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const body = error.response?.data as ApiErrorResponse | undefined;
        const msg = Array.isArray(body?.message)
          ? body.message[0]
          : (body?.message ?? 'Error al iniciar sesión');
        toast.error(msg);
      }
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearAuth();
      navigate('/login', { replace: true });
    },
  });
}
