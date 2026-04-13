import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scoringService } from '@/services/scoring.service';

export function useLeadScore(leadId: string) {
  return useQuery({
    queryKey: ['lead-score', leadId],
    queryFn: () => scoringService.getScore(leadId),
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useRecalculateScore(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => scoringService.recalculate(leadId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lead-score', leadId] });
    },
  });
}

export function useScoringInsights() {
  return useQuery({
    queryKey: ['scoring-insights'],
    queryFn: () => scoringService.getInsights(),
    staleTime: 5 * 60 * 1000,
  });
}
