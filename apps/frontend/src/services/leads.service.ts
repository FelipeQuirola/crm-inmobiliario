import { api } from '@/lib/api';
import type {
  Lead,
  LeadDetail,
  LeadsListResponse,
  CreateLeadInput,
  ListLeadsParams,
} from '@/types';

export const leadsService = {
  list: (params?: ListLeadsParams) =>
    api.get<LeadsListResponse>('/leads', { params }),

  getById: (id: string) =>
    api.get<LeadDetail>(`/leads/${id}`),

  create: (data: CreateLeadInput) =>
    api.post<Lead>('/leads', data),

  update: (id: string, data: Partial<CreateLeadInput>) =>
    api.patch<Lead>(`/leads/${id}`, data),

  changeStatus: (id: string, status: string, lostReason?: string) =>
    api.patch<Lead>(`/leads/${id}/status`, { status, lostReason }),

  assign: (id: string, assignedToId: string | null) =>
    api.patch<Lead>(`/leads/${id}/assign`, { assignedToId }),

  remove: (id: string) =>
    api.delete<void>(`/leads/${id}`),
};
