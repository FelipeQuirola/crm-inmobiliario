import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import { leadsService } from '@/services/leads.service';
import { usersService } from '@/services/users.service';
import type { CreateLeadInput, ListLeadsParams, ApiErrorResponse } from '@/types';

export const LEADS_KEY = 'leads';
export const USERS_KEY = 'tenantUsers';

// ─── Lista de leads con filtros ───────────────────────────────────────────────
export function useLeads(params?: ListLeadsParams) {
  return useQuery({
    queryKey: [LEADS_KEY, params],
    queryFn: () => leadsService.list(params).then((r) => r.data),
  });
}

// ─── Paginación infinita para "Load more" ─────────────────────────────────────
export function useLeadsInfinite(params?: Omit<ListLeadsParams, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: [LEADS_KEY, 'infinite', params],
    queryFn: ({ pageParam }) =>
      leadsService.list({ ...params, cursor: pageParam as string | undefined }).then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// ─── Detalle de lead ──────────────────────────────────────────────────────────
export function useLead(id: string) {
  return useQuery({
    queryKey: [LEADS_KEY, id],
    queryFn: () => leadsService.getById(id).then((r) => r.data),
    enabled: !!id,
  });
}

// ─── Crear lead ───────────────────────────────────────────────────────────────
export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeadInput) => leadsService.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [LEADS_KEY] });
      void qc.invalidateQueries({ queryKey: ['pipeline'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Lead creado correctamente');
    },
  });
}

// ─── Cambiar status ───────────────────────────────────────────────────────────
export function useChangeLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      lostReason,
    }: {
      id: string;
      status: string;
      lostReason?: string;
    }) => leadsService.changeStatus(id, status, lostReason),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: [LEADS_KEY] });
      void qc.invalidateQueries({ queryKey: [LEADS_KEY, variables.id] });
      void qc.invalidateQueries({ queryKey: ['pipeline'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Status actualizado');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const body = error.response?.data as ApiErrorResponse | undefined;
        const msg = Array.isArray(body?.message) ? body.message[0] : (body?.message ?? 'Error');
        toast.error(msg);
      }
    },
  });
}

// ─── Usuarios del tenant (para selector de asignación) ────────────────────────
export function useTenantUsers() {
  return useQuery({
    queryKey: [USERS_KEY],
    queryFn: () => usersService.listAll(),
    staleTime: 2 * 60 * 1000, // 2 minutos — cambia menos que los leads
  });
}
