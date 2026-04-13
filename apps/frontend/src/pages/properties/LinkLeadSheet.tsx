import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useLinkLead } from '@/hooks/useProperties';
import { useLeadsInfinite } from '@/hooks/useLeads';
import type { Lead } from '@/types';

interface LinkLeadSheetProps {
  propertyId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  linkedLeadIds: string[];
}

export function LinkLeadSheet({
  propertyId,
  open,
  onOpenChange,
  linkedLeadIds,
}: LinkLeadSheetProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const linkLead = useLinkLead(propertyId);

  const { data, isLoading } = useLeadsInfinite({ search: search || undefined });
  const leads = data?.pages.flatMap((p) => p.data) ?? [];
  const available = leads.filter((l) => !linkedLeadIds.includes(l.id));

  const handleLink = async () => {
    if (!selected) return;
    await linkLead.mutateAsync({ leadId: selected.id, notes: notes.trim() || undefined });
    setSelected(null);
    setNotes('');
    setSearch('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Vincular lead a propiedad</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <Input
            placeholder="Buscar lead por nombre o teléfono..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null);
            }}
          />

          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}

          {!isLoading && available.length === 0 && search && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No se encontraron leads
            </p>
          )}

          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {available.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => setSelected(lead)}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors hover:bg-gray-50 ${
                  selected?.id === lead.id ? 'border-indigo-500 bg-indigo-50' : ''
                }`}
              >
                <span className="font-medium text-gray-900">
                  {lead.firstName} {lead.lastName}
                </span>
                <span className="ml-2 text-xs text-gray-500">{lead.phone}</span>
              </button>
            ))}
          </div>

          {selected && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Lead seleccionado:{' '}
                <span className="font-medium text-gray-900">
                  {selected.firstName} {selected.lastName}
                </span>
              </p>
              <Textarea
                placeholder="Notas (opcional)..."
                rows={2}
                className="resize-none text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleLink()}
              disabled={!selected || linkLead.isPending}
            >
              {linkLead.isPending ? 'Vinculando...' : 'Vincular'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
