import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Plus, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PipelineColumn } from './PipelineColumn';
import { KanbanCardContent } from './LeadKanbanCard';
import { usePipelineBoard, useMoveLeadToStage } from './hooks/usePipeline';
import { LeadFormSheet } from '@/pages/leads/LeadFormSheet';
import { useNavigate } from 'react-router-dom';
import type { PipelineLead } from '@/types';

function sortByScore(leads: PipelineLead[]): PipelineLead[] {
  return [...leads].sort((a, b) => (b.score?.score ?? -1) - (a.score?.score ?? -1));
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BoardSkeleton() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-72 flex-shrink-0 space-y-2 rounded-xl border bg-gray-50 p-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((__, j) => (
            <Skeleton key={j} className="h-24 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Mobile card with stage selector ──────────────────────────────────────────

function MobilePipelineCard({
  lead,
  stages,
  onMove,
}: {
  lead: PipelineLead;
  stages: { id: string; name: string }[];
  onMove: (leadId: string, stageId: string | null) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div
        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => navigate(`/leads/${lead.id}`)}
      >
        <KanbanCardContent lead={lead} />
      </div>
      <div className="border-t px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <Select
          value={lead.stageId ?? 'unassigned'}
          onValueChange={(v) => onMove(lead.id, v === 'unassigned' ? null : v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Mover a etapa…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Sin etapa</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PipelinePage() {
  const { data: board, isLoading, isError } = usePipelineBoard();
  const moveToStage = useMoveLeadToStage();

  const [activeCard, setActiveCard] = useState<PipelineLead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sortScore, setSortScore] = useState(false);
  const [mobileColId, setMobileColId] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Initialize mobile column to first stage
  useEffect(() => {
    if (board && !mobileColId) {
      setMobileColId(board.stages[0]?.id ?? 'unassigned');
    }
  }, [board, mobileColId]);

  function findLead(id: string): PipelineLead | undefined {
    if (!board) return undefined;
    for (const col of board.stages) {
      const found = col.leads.find((l) => l.id === id);
      if (found) return found;
    }
    return board.unassigned.find((l) => l.id === id);
  }

  function handleDragStart(event: DragStartEvent) {
    const lead = findLead(String(event.active.id));
    setActiveCard(lead ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const destColumnId = resolveColumnId(String(over.id));
    if (!destColumnId) return;

    const lead = findLead(leadId);
    if (!lead) return;

    const newStageId = destColumnId === 'unassigned' ? null : destColumnId;
    if (newStageId === lead.stageId) return;

    moveToStage.mutate({ leadId, stageId: newStageId });
  }

  function resolveColumnId(overId: string): string | null {
    if (!board) return null;
    if (overId === 'unassigned') return 'unassigned';
    if (board.stages.some((c) => c.id === overId)) return overId;
    for (const col of board.stages) {
      if (col.leads.some((l) => l.id === overId)) return col.id;
    }
    if (board.unassigned.some((l) => l.id === overId)) return 'unassigned';
    return null;
  }

  if (isLoading) return <BoardSkeleton />;

  if (isError || !board) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        Error al cargar el pipeline. Intenta de nuevo.
      </div>
    );
  }

  const allColumns = [
    ...board.stages,
    {
      id: 'unassigned',
      name: 'Sin etapa',
      color: '#9ca3af',
      order: -1,
      probability: 0,
      leads: board.unassigned,
      checklists: [],
    },
  ];

  const activeColLeads = allColumns.find((c) => c.id === mobileColId)?.leads ?? [];
  const sortedMobileLeads = sortScore ? sortByScore(activeColLeads) : activeColLeads;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500">
            {board.stages.reduce((n, c) => n + c.leads.length, 0) + board.unassigned.length} leads activos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={sortScore ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortScore((v) => !v)}
            title="Ordenar por score de potencial"
          >
            <Flame className={`mr-1.5 h-4 w-4 ${sortScore ? 'text-orange-200' : 'text-orange-500'}`} />
            <span className="hidden sm:inline">Ordenar por score</span>
            <span className="sm:hidden">Score</span>
          </Button>
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nuevo lead</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* ── Mobile view ───────────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {/* Column tabs — horizontally scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allColumns.map((col) => {
            const count = (sortScore ? sortByScore(col.leads) : col.leads).length;
            return (
              <button
                key={col.id}
                onClick={() => setMobileColId(col.id)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                  mobileColId === col.id
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {col.name}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Cards for selected column */}
        {sortedMobileLeads.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">Sin leads en esta etapa</p>
          </div>
        ) : (
          sortedMobileLeads.map((lead) => (
            <MobilePipelineCard
              key={lead.id}
              lead={lead}
              stages={board.stages}
              onMove={(leadId, stageId) => moveToStage.mutate({ leadId, stageId })}
            />
          ))
        )}
      </div>

      {/* ── Desktop kanban ─────────────────────────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
          {allColumns.map((col) => (
            <PipelineColumn
              key={col.id}
              id={col.id}
              name={col.name}
              color={col.color}
              probability={(col as { probability?: number }).probability}
              leads={sortScore ? sortByScore(col.leads) : col.leads}
            />
          ))}
        </div>

        {/* Drag overlay — renders the card while dragging */}
        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div className="w-72 rotate-2 shadow-xl">
              <KanbanCardContent lead={activeCard} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* New lead sheet */}
      <LeadFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        defaultStageId={board.stages[0]?.id}
      />
    </div>
  );
}
