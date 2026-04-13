import { useState } from 'react';
import { Phone, MessageCircle, Mail, Calendar, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useCreateActivity } from '@/hooks/useActivities';
import type { ManualActivityType } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityTypeConfig {
  type: ManualActivityType;
  label: string;
  Icon: React.ElementType;
  color: string;
}

const QUICK_TYPES: ActivityTypeConfig[] = [
  { type: 'CALL',     label: 'Llamada',  Icon: Phone,          color: 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200' },
  { type: 'WHATSAPP', label: 'WhatsApp', Icon: MessageCircle,  color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
  { type: 'EMAIL',    label: 'Email',    Icon: Mail,           color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { type: 'MEETING',  label: 'Reunión',  Icon: Calendar,       color: 'text-violet-600 bg-violet-50 hover:bg-violet-100 border-violet-200' },
  { type: 'NOTE',     label: 'Nota',     Icon: FileText,       color: 'text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface LogActivityPanelProps {
  leadId: string;
}

export function LogActivityPanel({ leadId }: LogActivityPanelProps) {
  const createActivity = useCreateActivity(leadId);

  const [activeType, setActiveType] = useState<ManualActivityType | null>(null);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const handleOpen = (type: ManualActivityType) => {
    setActiveType(type);
    setDescription('');
    setDuration('');
    setScheduledAt('');
  };

  const handleClose = () => {
    setActiveType(null);
  };

  const handleSubmit = async () => {
    if (!activeType || !description.trim()) return;

    const metadata: { duration?: number; scheduledAt?: string } = {};
    if (activeType === 'CALL' && duration) {
      metadata.duration = parseInt(duration, 10);
    }
    if (activeType === 'MEETING' && scheduledAt) {
      metadata.scheduledAt = new Date(scheduledAt).toISOString();
    }

    await createActivity.mutateAsync({
      type: activeType,
      description: description.trim(),
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    });

    handleClose();
  };

  const config = QUICK_TYPES.find((t) => t.type === activeType);

  return (
    <div className="mb-4 rounded-lg border bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Registrar actividad
      </p>

      {/* Quick-type buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_TYPES.map(({ type, label, Icon, color }) => (
          <button
            key={type}
            type="button"
            onClick={() => (activeType === type ? handleClose() : handleOpen(type))}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${color} ${
              activeType === type ? 'ring-2 ring-offset-1 ring-current' : ''
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Expanded form */}
      {activeType && config && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <config.Icon className="h-4 w-4" />
              {config.label}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Textarea
            placeholder="¿Qué ocurrió en esta interacción?"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none text-sm"
            autoFocus
          />

          {activeType === 'CALL' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 whitespace-nowrap">
                Duración (min)
              </label>
              <Input
                type="number"
                min={1}
                placeholder="ej. 15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-8 w-28 text-sm"
              />
            </div>
          )}

          {activeType === 'MEETING' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 whitespace-nowrap">
                Fecha y hora
              </label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="h-8 flex-1 text-sm"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSubmit()}
              disabled={!description.trim() || createActivity.isPending}
            >
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
