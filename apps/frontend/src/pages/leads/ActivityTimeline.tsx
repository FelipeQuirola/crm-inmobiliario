import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityItem } from './ActivityItem';
import { useActivities } from '@/hooks/useActivities';

interface ActivityTimelineProps {
  leadId: string;
}

export function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useActivities(leadId);

  const activities = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4 p-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-7 w-7 flex-shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Sin actividad registrada. Registra el primer contacto.
      </p>
    );
  }

  return (
    <div>
      <ol className="relative border-l border-gray-200 pl-4">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} leadId={leadId} />
        ))}
      </ol>

      {hasNextPage && (
        <div className="mt-2 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-xs"
          >
            {isFetchingNextPage ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Cargar más actividades
          </Button>
        </div>
      )}
    </div>
  );
}
