import { api } from '@/lib/api';
import type { LeadScore, ScoringInsights } from '@/types';

export const scoringService = {
  getScore: (leadId: string) =>
    api.get<LeadScore | null>(`/leads/${leadId}/score`).then((r) => r.data),

  recalculate: (leadId: string) =>
    api.post<LeadScore | null>(`/leads/${leadId}/score/recalculate`).then((r) => r.data),

  getInsights: () =>
    api.get<ScoringInsights>('/scoring/insights').then((r) => r.data),
};
