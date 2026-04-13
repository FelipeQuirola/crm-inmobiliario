import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { activitiesService } from '@/services/activities.service';
import { useAuthStore } from '@/store/auth.store';
import { LEADS_KEY } from '@/hooks/useLeads';
import type { Activity, ActivityPage, CreateActivityInput } from '@/types';

export const ACTIVITIES_KEY = 'activities';

// ─── List (infinite / paginated) ─────────────────────────────────────────────

export function useActivities(leadId: string) {
  return useInfiniteQuery({
    queryKey: [ACTIVITIES_KEY, leadId],
    queryFn: ({ pageParam }) =>
      activitiesService.list(leadId, pageParam as number, 20),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: !!leadId,
  });
}

// ─── Create (with optimistic update) ─────────────────────────────────────────

export function useCreateActivity(leadId: string) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (data: CreateActivityInput) =>
      activitiesService.create(leadId, data),

    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: [ACTIVITIES_KEY, leadId] });

      const previous = qc.getQueryData<InfiniteData<ActivityPage>>([
        ACTIVITIES_KEY,
        leadId,
      ]);

      if (previous && user) {
        const optimistic: Activity = {
          id: `optimistic-${Date.now()}`,
          type: newData.type,
          description: newData.description,
          metadata: newData.metadata ?? null,
          createdAt: new Date().toISOString(),
          user: { id: user.id, name: user.name },
        };

        qc.setQueryData<InfiniteData<ActivityPage>>(
          [ACTIVITIES_KEY, leadId],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page, i) =>
                i === 0
                  ? {
                      ...page,
                      data: [optimistic, ...page.data],
                      total: page.total + 1,
                    }
                  : page,
              ),
            };
          },
        );
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData([ACTIVITIES_KEY, leadId], context.previous);
      }
      toast.error('Error al registrar la actividad');
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: [ACTIVITIES_KEY, leadId] });
      // lastContactAt changed in the backend
      void qc.invalidateQueries({ queryKey: [LEADS_KEY, leadId] });
    },

    onSuccess: () => {
      toast.success('Actividad registrada');
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteActivity(leadId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) =>
      activitiesService.remove(leadId, activityId),

    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [ACTIVITIES_KEY, leadId] });
      toast.success('Actividad eliminada');
    },

    onError: () => {
      toast.error('Error al eliminar la actividad');
    },
  });
}
