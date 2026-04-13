import { useState } from 'react';
import { Plus, Trash2, GripVertical, Edit2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  usePipelineStages,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
  useReorderStages,
  useStageChecklists,
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useLossReasons,
  useCreateLossReason,
  useUpdateLossReason,
  useDeleteLossReason,
} from '@/hooks/useFunnel';
import type { PipelineStage, LossReason } from '@/types';

// ─── Stage row ────────────────────────────────────────────────────────────────

function StageRow({ stage, onMoved }: { stage: PipelineStage; onMoved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);
  const [prob, setProb] = useState(stage.probability);
  const [color, setColor] = useState(stage.color);
  const [expanded, setExpanded] = useState(false);
  const [newItem, setNewItem] = useState('');

  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();
  const { data: checklists = [] } = useStageChecklists(expanded ? stage.id : '');
  const createItem = useCreateChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  function save() {
    updateStage.mutate({ id: stage.id, data: { name, probability: prob, color } }, {
      onSuccess: () => setEditing(false),
    });
  }

  function cancel() {
    setName(stage.name);
    setProb(stage.probability);
    setColor(stage.color);
    setEditing(false);
  }

  function addItem() {
    if (!newItem.trim()) return;
    createItem.mutate({ stageId: stage.id, data: { text: newItem.trim() } }, {
      onSuccess: () => setNewItem(''),
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-3 p-3">
        <GripVertical className="h-4 w-4 text-slate-400 cursor-grab flex-shrink-0" />
        <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />

        {editing ? (
          <div className="flex flex-1 items-center gap-2 flex-wrap">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 w-40 text-sm"
              placeholder="Nombre"
            />
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-8 rounded cursor-pointer border border-slate-300"
                title="Color"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Prob:</span>
              <Input
                type="number"
                value={prob}
                min={0}
                max={100}
                onChange={(e) => setProb(parseInt(e.target.value) || 0)}
                className="h-7 w-16 text-sm"
              />
              <span className="text-xs text-slate-500">%</span>
            </div>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={save} disabled={updateStage.isPending}>
              <Check className="h-3.5 w-3.5 text-green-600" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancel}>
              <X className="h-3.5 w-3.5 text-slate-500" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <span className="font-medium text-sm text-slate-900 truncate">{stage.name}</span>
            <Badge variant="outline" className="text-xs flex-shrink-0">{stage.probability}%</Badge>
            {stage.isDefault && (
              <Badge className="text-xs bg-blue-100 text-blue-700 flex-shrink-0">Por defecto</Badge>
            )}
          </div>
        )}

        {!editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded(!expanded)}
              title="Checklist"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              )}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(true)}>
              <Edit2 className="h-3.5 w-3.5 text-slate-500" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
              onClick={() => deleteStage.mutate(stage.id, { onSuccess: onMoved })}
              disabled={deleteStage.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Checklist de etapa</p>
          {checklists.map((item) => (
            <div key={item.id} className="flex items-center gap-2 group">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              <span className="flex-1 text-sm text-slate-700">{item.text}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                onClick={() => deleteItem.mutate({ stageId: stage.id, itemId: item.id })}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Nuevo item..."
              className="h-7 text-sm flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
            />
            <Button size="sm" variant="outline" className="h-7" onClick={addItem} disabled={!newItem.trim() || createItem.isPending}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loss reason row ──────────────────────────────────────────────────────────

function LossReasonRow({ reason }: { reason: LossReason }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(reason.name);
  const updateReason = useUpdateLossReason();
  const deleteReason = useDeleteLossReason();

  function save() {
    updateReason.mutate({ id: reason.id, data: { name } }, {
      onSuccess: () => setEditing(false),
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex-1">
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setName(reason.name); setEditing(false); } }}
          />
        ) : (
          <span className="text-sm text-slate-900">{reason.name}</span>
        )}
      </div>
      {reason._count && (
        <Badge variant="outline" className="text-xs flex-shrink-0">{reason._count.leads} leads</Badge>
      )}
      {!reason.isActive && (
        <Badge variant="outline" className="text-xs text-slate-400 flex-shrink-0">Inactivo</Badge>
      )}
      {editing ? (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={save} disabled={updateReason.isPending}>
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setName(reason.name); setEditing(false); }}>
            <X className="h-3.5 w-3.5 text-slate-500" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(true)}>
            <Edit2 className="h-3.5 w-3.5 text-slate-500" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
            onClick={() => deleteReason.mutate(reason.id)}
            disabled={deleteReason.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FunnelSettingsPage() {
  const { data: stages = [], isLoading: stagesLoading } = usePipelineStages();
  const { data: reasons = [], isLoading: reasonsLoading } = useLossReasons();
  const createStage = useCreateStage();
  const createReason = useCreateLossReason();
  const reorderStages = useReorderStages();

  const [newStageName, setNewStageName] = useState('');
  const [newReasonName, setNewReasonName] = useState('');

  function addStage() {
    if (!newStageName.trim()) return;
    createStage.mutate({ name: newStageName.trim() }, {
      onSuccess: () => setNewStageName(''),
    });
  }

  function addReason() {
    if (!newReasonName.trim()) return;
    createReason.mutate({ name: newReasonName.trim() }, {
      onSuccess: () => setNewReasonName(''),
    });
  }

  function moveStage(from: number, to: number) {
    const reordered = [...stages];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    reorderStages.mutate(reordered.map((s) => s.id));
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración del Embudo</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestiona las etapas del pipeline, sus probabilidades y los checklists por etapa.
        </p>
      </div>

      {/* ─── Pipeline stages ─── */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Etapas del Pipeline</h2>

        {stagesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="flex items-start gap-2">
                <div className="flex flex-col gap-1 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600"
                    disabled={idx === 0}
                    onClick={() => moveStage(idx, idx - 1)}
                    title="Subir"
                  >
                    ▲
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600"
                    disabled={idx === stages.length - 1}
                    onClick={() => moveStage(idx, idx + 1)}
                    title="Bajar"
                  >
                    ▼
                  </Button>
                </div>
                <div className="flex-1">
                  <StageRow stage={stage} onMoved={() => {}} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <Input
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="Nombre de nueva etapa..."
            className="h-9"
            onKeyDown={(e) => { if (e.key === 'Enter') addStage(); }}
          />
          <Button onClick={addStage} disabled={!newStageName.trim() || createStage.isPending} className="h-9">
            <Plus className="h-4 w-4 mr-1.5" />
            Agregar
          </Button>
        </div>
      </section>

      {/* ─── Loss reasons ─── */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Motivos de Pérdida</h2>
        <p className="text-xs text-slate-500 mb-3">
          Estos motivos se muestran al marcar un lead como Perdido.
        </p>

        {reasonsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {reasons.map((reason) => (
              <LossReasonRow key={reason.id} reason={reason} />
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <Input
            value={newReasonName}
            onChange={(e) => setNewReasonName(e.target.value)}
            placeholder="Nuevo motivo de pérdida..."
            className="h-9"
            onKeyDown={(e) => { if (e.key === 'Enter') addReason(); }}
          />
          <Button onClick={addReason} disabled={!newReasonName.trim() || createReason.isPending} className="h-9">
            <Plus className="h-4 w-4 mr-1.5" />
            Agregar
          </Button>
        </div>
      </section>
    </div>
  );
}
