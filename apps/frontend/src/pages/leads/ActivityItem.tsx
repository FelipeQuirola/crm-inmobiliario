import {
  Phone,
  Mail,
  Calendar,
  UserCheck,
  FileText,
  MessageCircle,
  RefreshCw,
  ArrowRightCircle,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
import { useDeleteActivity } from '@/hooks/useActivities';
import { useAuthStore } from '@/store/auth.store';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { Activity, ActivityType } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const AUTOMATIC_TYPES: ActivityType[] = [
  'LEAD_CREATED',
  'STAGE_CHANGED',
  'REASSIGNED',
  'STATUS_CHANGED',
];

const CONFIG: Record<
  ActivityType,
  { label: string; Icon: React.ElementType; dotCls: string }
> = {
  LEAD_CREATED:   { label: 'Lead creado',     Icon: UserPlus,         dotCls: 'bg-indigo-100 text-indigo-600' },
  STAGE_CHANGED:  { label: 'Etapa cambiada',  Icon: ArrowRightCircle, dotCls: 'bg-amber-100 text-amber-600' },
  REASSIGNED:     { label: 'Reasignado',      Icon: UserCheck,        dotCls: 'bg-blue-100 text-blue-600' },
  STATUS_CHANGED: { label: 'Status cambiado', Icon: RefreshCw,        dotCls: 'bg-red-100 text-red-600' },
  NOTE:           { label: 'Nota',            Icon: FileText,         dotCls: 'bg-gray-100 text-gray-600' },
  CALL:           { label: 'Llamada',         Icon: Phone,            dotCls: 'bg-green-100 text-green-600' },
  EMAIL:          { label: 'Email',           Icon: Mail,             dotCls: 'bg-blue-100 text-blue-600' },
  WHATSAPP:       { label: 'WhatsApp',        Icon: MessageCircle,    dotCls: 'bg-emerald-100 text-emerald-700' },
  MEETING:        { label: 'Reunión',         Icon: Calendar,         dotCls: 'bg-violet-100 text-violet-600' },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ActivityItemProps {
  activity: Activity;
  leadId: string;
}

export function ActivityItem({ activity, leadId }: ActivityItemProps) {
  const { Icon, label, dotCls } = CONFIG[activity.type];
  const currentUser = useAuthStore((s) => s.user);
  const deleteActivity = useDeleteActivity(leadId);

  const isAuto = AUTOMATIC_TYPES.includes(activity.type);
  const canDelete =
    !isAuto &&
    !activity.id.startsWith('optimistic-') &&
    (currentUser?.role === 'ADMIN' || currentUser?.id === activity.user.id);

  const metadata = activity.metadata as Record<string, unknown> | null;

  return (
    <li className="relative flex gap-3">
      {/* Timeline dot / user avatar */}
      <div className="flex flex-col items-center gap-1">
        <div
          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${dotCls}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        {!isAuto && (
          <UserAvatar
            name={activity.user.name}
            avatarUrl={activity.user.avatarUrl}
            size="xs"
            className="opacity-80"
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
            <p className="mt-0.5 text-sm text-gray-800">{activity.description}</p>

            {/* Extra metadata */}
            {typeof metadata?.duration === 'number' && (
              <p className="mt-0.5 text-xs text-gray-500">
                Duración: {metadata.duration} min
              </p>
            )}
            {typeof metadata?.scheduledAt === 'string' && (
              <p className="mt-0.5 text-xs text-gray-500">
                Programada:{' '}
                {new Date(metadata.scheduledAt).toLocaleString('es-EC', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}

            <p className="mt-1 text-xs text-gray-400">
              {activity.user.name}
              {' · '}
              <time dateTime={activity.createdAt}>
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </time>
            </p>
          </div>

          {/* Delete button */}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => deleteActivity.mutate(activity.id)}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </li>
  );
}
