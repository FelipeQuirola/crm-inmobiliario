import { api } from '@/lib/api';
import type {
  Notification,
  NotificationsListResponse,
  UnreadCountResponse,
} from '@/types';

export interface ListNotificationsParams {
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export const notificationsService = {
  list(params?: ListNotificationsParams): Promise<NotificationsListResponse> {
    return api.get('/notifications', { params }).then((r) => r.data);
  },

  unreadCount(): Promise<UnreadCountResponse> {
    return api.get('/notifications/unread-count').then((r) => r.data);
  },

  markAsRead(id: string): Promise<Notification> {
    return api.patch(`/notifications/${id}/read`).then((r) => r.data);
  },

  markAllAsRead(): Promise<{ success: boolean }> {
    return api.patch('/notifications/read-all').then((r) => r.data);
  },

  remove(id: string): Promise<{ success: boolean }> {
    return api.delete(`/notifications/${id}`).then((r) => r.data);
  },
};
