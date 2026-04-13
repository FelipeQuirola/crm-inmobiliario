import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pipelineService } from '@/services/pipeline.service';
import { LEADS_KEY } from '@/hooks/useLeads';
import type { PipelineBoard } from '@/types';

export const PIPELINE_KEY = 'pipeline';

export function usePipelineBoard() {
  return useQuery({
    queryKey: [PIPELINE_KEY, 'board'],
    queryFn: () => pipelineService.getBoard(),
  });
}

export function usePipelineStages() {
  return useQuery({
    queryKey: [PIPELINE_KEY, 'stages'],
    queryFn: () => pipelineService.getStages(),
    staleTime: 5 * 60_000, // etapas cambian muy poco
  });
}

export function useMoveLeadToStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      stageId,
    }: {
      leadId: string;
      stageId: string | null;
    }) => pipelineService.moveToStage(leadId, stageId),

    // ── Optimistic update — mueve la tarjeta antes de que responda el servidor ──
    onMutate: async ({ leadId, stageId }) => {
      // Cancelar refetches en vuelo para no pisar el update optimista
      await queryClient.cancelQueries({ queryKey: [PIPELINE_KEY, 'board'] });

      const previous = queryClient.getQueryData<PipelineBoard>([PIPELINE_KEY, 'board']);

      if (previous) {
        queryClient.setQueryData<PipelineBoard>([PIPELINE_KEY, 'board'], (old) => {
          if (!old) return old;

          // Extraer el lead de donde esté ahora
          let movedLead = old.unassigned.find((l) => l.id === leadId);
          const newUnassigned = old.unassigned.filter((l) => l.id !== leadId);

          const newStages = old.stages.map((col) => {
            const found = col.leads.find((l) => l.id === leadId);
            if (found) movedLead = found;
            return { ...col, leads: col.leads.filter((l) => l.id !== leadId) };
          });

          if (!movedLead) return old;

          const updatedLead = { ...movedLead, stageId };

          if (stageId === null) {
            return { stages: newStages, unassigned: [updatedLead, ...newUnassigned] };
          }

          return {
            stages: newStages.map((col) =>
              col.id === stageId
                ? { ...col, leads: [updatedLead, ...col.leads] }
                : col,
            ),
            unassigned: newUnassigned,
          };
        });
      }

      return { previous };
    },

    // ── Revertir si el servidor falla ────────────────────────────────────────
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([PIPELINE_KEY, 'board'], context.previous);
      }
    },

    // ── Tras confirmar el servidor: invalidar todas las queries afectadas ─────
    onSettled: (_data, _err, variables) => {
      // Board: sincronizar con el servidor (el optimista puede diferir)
      void queryClient.invalidateQueries({ queryKey: [PIPELINE_KEY, 'board'] });
      // Detalle del lead afectado (etapa, actividad STAGE_CHANGED)
      void queryClient.invalidateQueries({ queryKey: [LEADS_KEY, variables.leadId] });
      // Lista de leads (la columna "Etapa" en la tabla)
      void queryClient.invalidateQueries({ queryKey: [LEADS_KEY] });
    },
  });
}
