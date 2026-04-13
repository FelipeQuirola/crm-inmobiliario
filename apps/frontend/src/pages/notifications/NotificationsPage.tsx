import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Clock, AlertTriangle, UserX, Calendar,
  CheckCheck, Trash2, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import type { Notification, NotificationType } from '@/types';

const PAGE_SIZE = 20;

// ─── Icon per type ────────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: NotificationType }) {
  const cls = 'h-5 w-5 shrink-0';
  switch (type) {
    case 'LEAD_INACTIVE':     return <Clock className={cn(cls, 'text-amber-500')} />;
    case 'ACTION_OVERDUE':    return <AlertTriangle className={cn(cls, 'text-red-500')} />;
    case 'LEAD_UNCONTACTED':  return <UserX className={cn(cls, 'text-orange-500')} />;
    case 'MEETING_REMINDER':  return <Calendar className={cn(cls, 'text-blue-500')} />;
  }
}

function typeLabel(type: NotificationType) {
  switch (type) {
    case 'LEAD_INACTIVE':     return 'Lead inactivo';
    case 'ACTION_OVERDUE':    return 'Acción vencida';
    case 'LEAD_UNCONTACTED':  return 'Sin contactar';
    case 'MEETING_REMINDER':  return 'Reunión';
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

// ─── Page ─────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'unread';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [offset, setOffset] = useState(0);

  const queryParams = {
    limit: PAGE_SIZE,
    offset,
    ...(filter === 'unread' ? { isRead: false } : {}),
  };

  const { data, isLoading } = useNotifications(queryParams);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotif = useDeleteNotification();

  const notifications = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const handleClick = (n: Notification) => {
    if (!n.isRead) markAsRead.mutate(n.id);
    if (n.leadId) navigate(`/leads/${n.leadId}`);
  };

  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    setOffset(0);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} notificaciones</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => markAllAsRead.mutate()}
          disabled={markAllAsRead.isPending}
        >
          <CheckCheck className="h-4 w-4" />
          Marcar todas como leídas
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {(['all', 'unread'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {f === 'all' ? 'Todas' : 'No leídas'}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-gray-400">
          <Bell className="h-12 w-12 opacity-25" />
          <p className="text-base font-medium">
            {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors',
                !n.isRead && 'border-blue-100 bg-blue-50/40',
              )}
            >
              {/* Icon */}
              <div className="mt-0.5">
                <NotifIcon type={n.type} />
              </div>

              {/* Content */}
              <button
                className="flex-1 min-w-0 text-left"
                onClick={() => handleClick(n)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">
                    {n.title}
                  </span>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    n.type === 'ACTION_OVERDUE'   && 'bg-red-100 text-red-700',
                    n.type === 'LEAD_INACTIVE'    && 'bg-amber-100 text-amber-700',
                    n.type === 'LEAD_UNCONTACTED' && 'bg-orange-100 text-orange-700',
                    n.type === 'MEETING_REMINDER' && 'bg-blue-100 text-blue-700',
                  )}>
                    {typeLabel(n.type)}
                  </span>
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{relativeTime(n.createdAt)}</p>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-blue-500 hover:text-blue-700"
                    title="Marcar como leída"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead.mutate(n.id);
                    }}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-red-500"
                  title="Eliminar"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotif.mutate(n.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <span>Página {currentPage} de {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
