import { useNavigate } from 'react-router-dom';
import { Bell, Clock, AlertTriangle, UserX, Calendar, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useUnreadCount,
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/useNotifications';
import type { Notification, NotificationType } from '@/types';

// ─── Icon per type ────────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'LEAD_INACTIVE':
      return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
    case 'ACTION_OVERDUE':
      return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
    case 'LEAD_UNCONTACTED':
      return <UserX className="h-4 w-4 text-orange-500 shrink-0" />;
    case 'MEETING_REMINDER':
      return <Calendar className="h-4 w-4 text-blue-500 shrink-0" />;
  }
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora mismo';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({
  notification,
  onAction,
}: {
  notification: Notification;
  onAction: (n: Notification) => void;
}) {
  return (
    <button
      onClick={() => onAction(notification)}
      className={cn(
        'w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted',
        !notification.isRead && 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60',
      )}
    >
      <div className="mt-0.5">
        <NotifIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {relativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
      )}
    </button>
  );
}

// ─── Popover component ────────────────────────────────────────────────────────

export function NotificationPopover() {
  const navigate = useNavigate();
  const { data: countData } = useUnreadCount();
  const { data } = useNotifications({ limit: 10 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const count = countData?.count ?? 0;
  const notifications = data?.data ?? [];

  const handleNotifClick = (n: Notification) => {
    if (!n.isRead) markAsRead.mutate(n.id);
    if (n.leadId) navigate(`/leads/${n.leadId}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[380px] p-0 shadow-xl border border-border bg-background z-50 rounded-xl overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-blue-600 hover:text-blue-700"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto bg-background py-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">No tienes notificaciones pendientes</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotifRow key={n.id} notification={n} onAction={handleNotifClick} />
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border bg-background px-4 py-2.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-blue-600 hover:text-blue-700"
              onClick={() => navigate('/notificaciones')}
            >
              Ver todas las notificaciones
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
