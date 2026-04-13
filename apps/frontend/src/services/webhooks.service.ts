import { api } from '@/lib/api';
import type {
  WebhookConfig,
  WebhookEventsResponse,
  ListWebhookEventsParams,
} from '@/types';

export const webhooksService = {
  getConfig(): Promise<WebhookConfig> {
    return api.get('/webhooks/config').then((r) => r.data);
  },

  listEvents(params?: ListWebhookEventsParams): Promise<WebhookEventsResponse> {
    return api.get('/webhooks/events', { params }).then((r) => r.data);
  },
};
