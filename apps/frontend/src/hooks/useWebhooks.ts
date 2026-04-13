import { useQuery } from '@tanstack/react-query';
import { webhooksService } from '@/services/webhooks.service';
import type { ListWebhookEventsParams } from '@/types';

export function useWebhookConfig() {
  return useQuery({
    queryKey: ['webhook-config'],
    queryFn: () => webhooksService.getConfig(),
  });
}

export function useWebhookEvents(params?: ListWebhookEventsParams) {
  return useQuery({
    queryKey: ['webhook-events', params],
    queryFn: () => webhooksService.listEvents(params),
  });
}
