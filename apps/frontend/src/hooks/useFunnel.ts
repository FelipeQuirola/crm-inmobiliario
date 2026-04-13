import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pipelineService } from '@/services/pipeline.service';
import { lossReasonsService } from '@/services/loss-reasons.service';
import { reportsService } from '@/services/reports.service';

// ─── Stage management ─────────────────────────────────────────────────────────

export function usePipelineStages() {
  return useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: () => pipelineService.getStages(),
  });
}

export function useCreateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string; probability?: number; description?: string }) =>
      pipelineService.createStage(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      void qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

export function useUpdateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; color: string; probability: number; description: string; isDefault: boolean }> }) =>
      pipelineService.updateStage(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      void qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

export function useDeleteStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipelineService.deleteStage(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      void qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

export function useReorderStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => pipelineService.reorderStages(orderedIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      void qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

// ─── Stage checklists ─────────────────────────────────────────────────────────

export function useStageChecklists(stageId: string) {
  return useQuery({
    queryKey: ['stage-checklists', stageId],
    queryFn: () => pipelineService.getStageChecklists(stageId),
    enabled: !!stageId,
  });
}

export function useCreateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, data }: { stageId: string; data: { text: string; order?: number } }) =>
      pipelineService.createChecklistItem(stageId, data),
    onSuccess: (_, { stageId }) => {
      void qc.invalidateQueries({ queryKey: ['stage-checklists', stageId] });
      void qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
    },
  });
}

export function useUpdateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, itemId, data }: { stageId: string; itemId: string; data: { text?: string; order?: number } }) =>
      pipelineService.updateChecklistItem(stageId, itemId, data),
    onSuccess: (_, { stageId }) => {
      void qc.invalidateQueries({ queryKey: ['stage-checklists', stageId] });
    },
  });
}

export function useDeleteChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, itemId }: { stageId: string; itemId: string }) =>
      pipelineService.deleteChecklistItem(stageId, itemId),
    onSuccess: (_, { stageId }) => {
      void qc.invalidateQueries({ queryKey: ['stage-checklists', stageId] });
      void qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
    },
  });
}

// ─── Lead checklist ───────────────────────────────────────────────────────────

export function useLeadChecklist(leadId: string) {
  return useQuery({
    queryKey: ['lead-checklist', leadId],
    queryFn: () => pipelineService.getLeadChecklist(leadId),
    enabled: !!leadId,
  });
}

export function useToggleLeadChecklistItem(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, isDone }: { checklistId: string; isDone: boolean }) =>
      pipelineService.toggleLeadChecklistItem(leadId, checklistId, isDone),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lead-checklist', leadId] });
    },
  });
}

// ─── Lead stage history ───────────────────────────────────────────────────────

export function useLeadStageHistory(leadId: string) {
  return useQuery({
    queryKey: ['lead-stage-history', leadId],
    queryFn: () => pipelineService.getLeadStageHistory(leadId),
    enabled: !!leadId,
  });
}

// ─── Loss reasons ─────────────────────────────────────────────────────────────

export function useLossReasons() {
  return useQuery({
    queryKey: ['loss-reasons'],
    queryFn: () => lossReasonsService.findAll(),
  });
}

export function useCreateLossReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => lossReasonsService.create(data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['loss-reasons'] }),
  });
}

export function useUpdateLossReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; isActive?: boolean } }) =>
      lossReasonsService.update(id, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['loss-reasons'] }),
  });
}

export function useDeleteLossReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lossReasonsService.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['loss-reasons'] }),
  });
}

// ─── Funnel reports ───────────────────────────────────────────────────────────

export function useProjectedRevenue() {
  return useQuery({
    queryKey: ['reports-projected-revenue'],
    queryFn: () => reportsService.projectedRevenue(),
  });
}

export function useLostByReason() {
  return useQuery({
    queryKey: ['reports-lost-by-reason'],
    queryFn: () => reportsService.lostByReason(),
  });
}

export function useVelocity() {
  return useQuery({
    queryKey: ['reports-velocity'],
    queryFn: () => reportsService.velocity(),
  });
}
