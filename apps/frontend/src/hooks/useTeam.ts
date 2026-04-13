import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import { usersService } from '@/services/users.service';
import { USERS_KEY } from '@/hooks/useLeads';
import type { CreateUserInput, UpdateUserInput, ApiErrorResponse } from '@/types';

export const TEAM_KEY = 'team';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Invalida todas las queries que dependen del estado del equipo. */
function invalidateTeamRelated(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: [TEAM_KEY] });
  // El selector de asignación en leads/pipeline usa esta key
  void qc.invalidateQueries({ queryKey: [USERS_KEY] });
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useTeamMembers() {
  return useQuery({
    queryKey: [TEAM_KEY],
    queryFn: () => usersService.listAll(),
    staleTime: 60_000,
  });
}

export function useActiveUsers() {
  return useQuery({
    queryKey: ['active-users'],
    queryFn: () => usersService.listActive(),
    staleTime: 60_000,
  });
}

export function useTeamMember(id: string) {
  return useQuery({
    queryKey: [TEAM_KEY, id],
    queryFn: () => usersService.getById(id),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) => usersService.create(data),
    onSuccess: () => {
      invalidateTeamRelated(qc);
      toast.success('Vendedor creado correctamente');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const body = error.response?.data as ApiErrorResponse | undefined;
        const msg = Array.isArray(body?.message)
          ? body.message[0]
          : (body?.message ?? 'Error al crear usuario');
        toast.error(msg);
      }
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      usersService.update(id, data),
    onSuccess: (_data, variables) => {
      invalidateTeamRelated(qc);
      // Invalida el detalle individual si estaba cacheado
      void qc.invalidateQueries({ queryKey: [TEAM_KEY, variables.id] });
      toast.success('Usuario actualizado correctamente');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const body = error.response?.data as ApiErrorResponse | undefined;
        const msg = Array.isArray(body?.message)
          ? body.message[0]
          : (body?.message ?? 'Error al actualizar usuario');
        toast.error(msg);
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usersService.changePassword(id, newPassword),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const body = error.response?.data as ApiErrorResponse | undefined;
        const msg = Array.isArray(body?.message)
          ? body.message[0]
          : (body?.message ?? 'Error al cambiar contraseña');
        toast.error(msg);
      }
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersService.deactivate(id),
    onSuccess: () => {
      invalidateTeamRelated(qc);
      // Leads desasignados → refrescar listas, pipeline y dashboard
      void qc.invalidateQueries({ queryKey: ['leads'] });
      void qc.invalidateQueries({ queryKey: ['pipeline'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Usuario desactivado y leads reasignados');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const body = error.response?.data as ApiErrorResponse | undefined;
        const msg = Array.isArray(body?.message)
          ? body.message[0]
          : (body?.message ?? 'Error al desactivar usuario');
        toast.error(msg);
      }
    },
  });
}
