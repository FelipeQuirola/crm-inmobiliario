import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, Clock, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LeadSourceBadge } from '@/pages/leads/LeadStatusBadge';
import { ScoreBadge } from '@/components/scoring/ScoreBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatUSD } from '@/lib/utils';
import type { PipelineLead } from '@/types';

function isOverdue(nextActionAt: string | null) {
  if (!nextActionAt) return false;
  return new Date(nextActionAt) < new Date();
}

// ─── Card visual content (used both in sortable wrapper and drag overlay) ─────

export function KanbanCardContent({ lead }: { lead: PipelineLead }) {
  const overdue = isOverdue(lead.nextActionAt);

  const checklistItems = lead.checklistProgress ?? [];
  const doneItems = checklistItems.filter((p) => p.isDone).length;
  const totalItems = checklistItems.length;
  const checklistPct = totalItems > 0 ? (doneItems / totalItems) * 100 : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      {/* Name + score + overdue alert */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 leading-tight flex-1 min-w-0 truncate">
          {lead.firstName} {lead.lastName}
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {lead.score && (
            <ScoreBadge score={lead.score.score} temperature={lead.score.temperature} size="sm" />
          )}
          {overdue && (
            <span title="Acción vencida">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </span>
          )}
        </div>
      </div>

      {/* Phone */}
      <p className="mt-1 text-xs text-gray-500">{lead.phone}</p>

      {/* Property interest */}
      {lead.propertyInterest && (
        <p className="mt-1.5 line-clamp-2 text-xs text-gray-600">
          {lead.propertyInterest}
        </p>
      )}

      {/* Budget */}
      {lead.budget != null && (
        <p className="mt-1.5 text-xs font-medium text-gray-700">
          {formatUSD(lead.budget)}
        </p>
      )}

      {/* Badges row: days in stage + checklist progress */}
      {(lead.daysInCurrentStage > 0 || totalItems > 0) && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {lead.daysInCurrentStage > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <Clock className="h-2.5 w-2.5" />
              {lead.daysInCurrentStage}d
            </span>
          )}
          {totalItems > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <CheckSquare className="h-2.5 w-2.5" />
              {doneItems}/{totalItems}
            </span>
          )}
        </div>
      )}

      {/* Checklist progress bar */}
      {totalItems > 0 && (
        <div className="mt-1.5 h-1 w-full rounded-full bg-slate-100">
          <div
            className="h-1 rounded-full bg-emerald-400 transition-all"
            style={{ width: `${checklistPct}%` }}
          />
        </div>
      )}

      {/* Footer: source badge + assignee */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <LeadSourceBadge source={lead.source} />

        {lead.assignedTo && (
          <UserAvatar
            name={lead.assignedTo.name}
            avatarUrl={lead.assignedTo.avatarUrl}
            size="xs"
          />
        )}
      </div>
    </div>
  );
}

// ─── Sortable wrapper ─────────────────────────────────────────────────────────

interface LeadKanbanCardProps {
  lead: PipelineLead;
}

export function LeadKanbanCard({ lead }: LeadKanbanCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
      onDoubleClick={() => navigate(`/leads/${lead.id}`)}
    >
      <KanbanCardContent lead={lead} />
    </div>
  );
}
