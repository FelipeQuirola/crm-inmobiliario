import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService, type ListNotificationsParams } from '@/services/notifications.service';

const NOTIFICATIONS_KEY = 'notifications';
const UNREAD_COUNT_KEY = 'unread-count';

// ─── Unread count (polled every 60s) ─────────────────────────────────────────

export function useUnreadCount() {
  return useQuery({
    queryKey: [UNREAD_COUNT_KEY],
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 60_000,
  });
}

// ─── List notifications ───────────────────────────────────────────────────────

export function useNotifications(params?: ListNotificationsParams) {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, params],
    queryFn: () => notificationsService.list(params),
  });
}

// ─── Mark one as read ─────────────────────────────────────────────────────────

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      void qc.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}

// ─── Mark all as read ─────────────────────────────────────────────────────────

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      void qc.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      void qc.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}
