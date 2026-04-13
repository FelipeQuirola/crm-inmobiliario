import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useUpdateEventStatus, useDeleteEvent } from '@/hooks/useCalendar';
import { useAuthStore } from '@/store/auth.store';
import { EditEventSheet } from './EditEventSheet';
import type { CalendarEvent, CalendarEventType } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<CalendarEventType, { label: string; color: string }> = {
  MEETING: { label: 'Reunión',  color: 'bg-violet-100 text-violet-700' },
  CALL:    { label: 'Llamada',  color: 'bg-green-100 text-green-700' },
  TASK:    { label: 'Tarea',    color: 'bg-blue-100 text-blue-700' },
};

const STATUS_LABELS = {
  PENDING:   'Pendiente',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface EventDetailPopoverProps {
  event:        CalendarEvent;
  onClose:      () => void;
}

export function EventDetailPopover({ event, onClose }: EventDetailPopoverProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const updateStatus = useUpdateEventStatus();
  const deleteEvent = useDeleteEvent();
  const [editOpen, setEditOpen] = useState(false);

  const canEdit =
    currentUser?.role === 'ADMIN' || currentUser?.id === event.user.id;

  const typeConfig = TYPE_CONFIG[event.type];

  const handleStatus = async (status: 'COMPLETED' | 'CANCELLED' | 'PENDING') => {
    await updateStatus.mutateAsync({
      id: event.id,
      status,
      leadId: event.lead?.id,
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteEvent.mutateAsync(event.id);
    onClose();
  };

  return (
    <>
      <div className="w-72 space-y-3 p-1">
        {/* Type badge + title */}
        <div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
          <h3 className="mt-1.5 text-sm font-semibold text-gray-900 leading-snug">
            {event.title}
          </h3>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            {format(new Date(event.startAt), "d MMM · HH:mm", { locale: es })}
            {' — '}
            {format(new Date(event.endAt), "HH:mm")}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-gray-600 leading-relaxed">{event.description}</p>
        )}

        {/* Lead */}
        {event.lead && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-800">
                {event.lead.firstName} {event.lead.lastName}
              </p>
              <p className="text-xs text-gray-500">{event.lead.phone}</p>
            </div>
            <button
              onClick={() => { navigate(`/leads/${event.lead!.id}`); onClose(); }}
              className="ml-auto flex-shrink-0 text-indigo-500 hover:text-indigo-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Estado:</span>
          <span className={`font-medium ${
            event.status === 'COMPLETED' ? 'text-green-600' :
            event.status === 'CANCELLED' ? 'text-red-500' :
            'text-amber-600'
          }`}>
            {STATUS_LABELS[event.status]}
          </span>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="border-t pt-3 space-y-2">
            {/* Status actions */}
            {event.status === 'PENDING' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => void handleStatus('COMPLETED')}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-xs text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => void handleStatus('CANCELLED')}
                  disabled={updateStatus.isPending}
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Cancelar
                </Button>
              </div>
            )}
            {event.status !== 'PENDING' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs"
                onClick={() => void handleStatus('PENDING')}
                disabled={updateStatus.isPending}
              >
                <Calendar className="mr-1 h-3 w-3" />
                Marcar pendiente
              </Button>
            )}

            {/* Edit + Delete */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={() => setEditOpen(true)}
              >
                <Edit2 className="mr-1 h-3 w-3" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
                    <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => void handleDelete()}
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>

      <EditEventSheet
        open={editOpen}
        onOpenChange={(v) => { setEditOpen(v); if (!v) onClose(); }}
        event={event}
      />
    </>
  );
}
