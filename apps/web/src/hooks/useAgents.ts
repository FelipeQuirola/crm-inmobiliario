import { useQuery } from '@tanstack/react-query';
import { api, buildQuery } from '@/api/client';
import type { Agent } from '@/types';

export function useAgents() {
  return useQuery({
    queryKey: ['public-agents'],
    queryFn: async () => {
      const q = buildQuery({});
      const res = await api.get<Agent[]>(`/public/agents?${q}`);
      return res.data;
    },
  });
}
