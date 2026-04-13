import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, Mail, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeadMessages } from '@/hooks/useTemplates';
import type { MessageStatus, MessageType } from '@/types';

const STATUS_BADGE: Record<MessageStatus, { label: string; cls: string }> = {
  SENT:    { label: 'Enviado',   cls: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  FAILED:  { label: 'Error',     cls: 'bg-red-100 text-red-600' },
};

const TYPE_ICON: Record<MessageType, React.ElementType> = {
  WHATSAPP: MessageCircle,
  EMAIL:    Mail,
};

const TYPE_COLOR: Record<MessageType, string> = {
  WHATSAPP: 'text-green-600 bg-green-50',
  EMAIL:    'text-blue-600 bg-blue-50',
};

interface MessageHistoryProps {
  leadId: string;
}

export function MessageHistory({ leadId }: MessageHistoryProps) {
  const { data: messages, isLoading } = useLeadMessages(leadId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <Inbox className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-muted-foreground">Sin mensajes enviados aún</p>
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {messages.map((msg) => {
        const Icon   = TYPE_ICON[msg.type];
        const color  = TYPE_COLOR[msg.type];
        const badge  = STATUS_BADGE[msg.status];

        return (
          <li key={msg.id} className="flex gap-3 py-3">
            <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-900">
                  {msg.type === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
                </span>
                {msg.template && (
                  <span className="text-xs text-muted-foreground">
                    · {msg.template.name}
                  </span>
                )}
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>

              {msg.subject && (
                <p className="mt-0.5 text-xs font-medium text-gray-700 truncate">
                  {msg.subject}
                </p>
              )}

              <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                {msg.body}
              </p>

              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{msg.user.name}</span>
                <span>·</span>
                <span>
                  {format(new Date(msg.createdAt), "d MMM yyyy HH:mm", { locale: es })}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
