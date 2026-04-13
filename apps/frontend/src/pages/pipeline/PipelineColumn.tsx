import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { LeadKanbanCard } from './LeadKanbanCard';
import type { PipelineLead } from '@/types';

interface PipelineColumnProps {
  id: string;
  name: string;
  color: string;
  probability?: number;
  leads: PipelineLead[];
}

export function PipelineColumn({ id, name, color, probability, leads }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  // Projected revenue = sum of budgets × probability
  const totalBudget = leads.reduce((s, l) => s + (l.budget ?? 0), 0);
  const projected = probability !== undefined ? totalBudget * (probability / 100) : null;

  const formatMoney = (v: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50">
      {/* Column header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-semibold text-gray-800 flex-1 min-w-0 truncate">{name}</span>
          <span className="flex-shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
            {leads.length}
          </span>
          {probability !== undefined && (
            <span className="flex-shrink-0 text-xs text-slate-400 font-medium">
              {probability}%
            </span>
          )}
        </div>
        {projected !== null && projected > 0 && (
          <p className="mt-1 text-xs text-emerald-600 font-medium">
            ~{formatMoney(projected)} proyectado
          </p>
        )}
      </div>

      {/* Cards drop area */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 overflow-y-auto p-3 transition-colors ${
          isOver ? 'bg-indigo-50' : ''
        }`}
        style={{ minHeight: '120px', maxHeight: 'calc(100vh - 280px)' }}
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <LeadKanbanCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-8">
            <p className="text-xs text-gray-400">Arrastra leads aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}
