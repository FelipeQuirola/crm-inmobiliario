import { api } from '@/lib/api';
import type { LossReason } from '@/types';

export const lossReasonsService = {
  findAll: () =>
    api.get<LossReason[]>('/loss-reasons').then((r) => r.data),

  create: (data: { name: string }) =>
    api.post<LossReason>('/loss-reasons', data).then((r) => r.data),

  update: (id: string, data: { name?: string; isActive?: boolean }) =>
    api.patch<LossReason>(`/loss-reasons/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete<{ deleted: boolean }>(`/loss-reasons/${id}`).then((r) => r.data),
};
