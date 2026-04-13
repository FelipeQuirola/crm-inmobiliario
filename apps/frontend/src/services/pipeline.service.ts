import { api } from '@/lib/api';
import type {
  PipelineBoard,
  PipelineStage,
  PipelineLead,
  StageChecklistItem,
  LeadChecklistProgress,
  LeadStageHistory,
} from '@/types';

export const pipelineService = {
  getBoard: () =>
    api.get<PipelineBoard>('/pipeline').then((r) => r.data),

  getStages: () =>
    api.get<PipelineStage[]>('/pipeline/stages').then((r) => r.data),

  createStage: (data: { name: string; color?: string; probability?: number; description?: string }) =>
    api.post<PipelineStage>('/pipeline/stages', data).then((r) => r.data),

  updateStage: (id: string, data: Partial<{ name: string; color: string; probability: number; description: string; isDefault: boolean }>) =>
    api.patch<PipelineStage>(`/pipeline/stages/${id}`, data).then((r) => r.data),

  deleteStage: (id: string) =>
    api.delete<{ deleted: boolean }>(`/pipeline/stages/${id}`).then((r) => r.data),

  reorderStages: (orderedIds: string[]) =>
    api.patch<PipelineStage[]>('/pipeline/stages/reorder', { orderedIds }).then((r) => r.data),

  moveToStage: (leadId: string, stageId: string | null) =>
    api.patch<PipelineLead>(`/pipeline/leads/${leadId}/stage`, { stageId }).then((r) => r.data),

  // ─── Stage checklists ───────────────────────────────────────────────────────
  getStageChecklists: (stageId: string) =>
    api.get<StageChecklistItem[]>(`/pipeline/stages/${stageId}/checklist`).then((r) => r.data),

  createChecklistItem: (stageId: string, data: { text: string; order?: number }) =>
    api.post<StageChecklistItem>(`/pipeline/stages/${stageId}/checklist`, data).then((r) => r.data),

  updateChecklistItem: (stageId: string, itemId: string, data: { text?: string; order?: number }) =>
    api.patch<StageChecklistItem>(`/pipeline/stages/${stageId}/checklist/${itemId}`, data).then((r) => r.data),

  deleteChecklistItem: (stageId: string, itemId: string) =>
    api.delete<{ deleted: boolean }>(`/pipeline/stages/${stageId}/checklist/${itemId}`).then((r) => r.data),

  // ─── Lead checklist ─────────────────────────────────────────────────────────
  getLeadChecklist: (leadId: string) =>
    api.get<LeadChecklistProgress[]>(`/pipeline/leads/${leadId}/checklist`).then((r) => r.data),

  toggleLeadChecklistItem: (leadId: string, checklistId: string, isDone: boolean) =>
    api.patch(`/pipeline/leads/${leadId}/checklist/${checklistId}`, { isDone }).then((r) => r.data),

  // ─── Lead stage history ─────────────────────────────────────────────────────
  getLeadStageHistory: (leadId: string) =>
    api.get<LeadStageHistory[]>(`/pipeline/leads/${leadId}/stage-history`).then((r) => r.data),
};
