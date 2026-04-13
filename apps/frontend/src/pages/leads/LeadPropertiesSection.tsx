import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Link2,
  Unlink,
  DollarSign,
  Maximize2,
  Bed,
  Bath,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useLeadProperties, useLinkProperty, useUnlinkProperty } from '@/hooks/useProperties';
import { useProperties } from '@/hooks/useProperties';
import { formatUSD } from '@/lib/utils';
import type { Property } from '@/types';

// ─── Link sheet ───────────────────────────────────────────────────────────────

function LinkPropertySheet({
  leadId,
  open,
  onOpenChange,
  linkedPropertyIds,
}: {
  leadId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  linkedPropertyIds: string[];
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Property | null>(null);
  const [notes, setNotes] = useState('');
  const linkProperty = useLinkProperty(leadId);

  const { data, isLoading } = useProperties({ search: search || undefined });
  const properties = data?.pages.flatMap((p) => p.data) ?? [];
  const available = properties.filter((p) => !linkedPropertyIds.includes(p.id));

  const handleLink = async () => {
    if (!selected) return;
    await linkProperty.mutateAsync({ propertyId: selected.id, notes: notes.trim() || undefined });
    setSelected(null);
    setNotes('');
    setSearch('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Vincular propiedad</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <Input
            placeholder="Buscar propiedad..."
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

          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {available.map((prop) => (
              <button
                key={prop.id}
                type="button"
                onClick={() => setSelected(prop)}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors hover:bg-gray-50 ${
                  selected?.id === prop.id ? 'border-indigo-500 bg-indigo-50' : ''
                }`}
              >
                <span className="font-medium text-gray-900 line-clamp-1">{prop.title}</span>
                <span className="ml-2 text-xs text-gray-500">{formatUSD(prop.price)}</span>
              </button>
            ))}
            {!isLoading && available.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay propiedades disponibles
              </p>
            )}
          </div>

          {selected && (
            <Textarea
              placeholder="Notas (opcional)..."
              rows={2}
              className="resize-none text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleLink()}
              disabled={!selected || linkProperty.isPending}
            >
              {linkProperty.isPending ? 'Vinculando...' : 'Vincular'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface LeadPropertiesSectionProps {
  leadId: string;
}

export function LeadPropertiesSection({ leadId }: LeadPropertiesSectionProps) {
  const navigate = useNavigate();
  const { data: links, isLoading } = useLeadProperties(leadId);
  const unlinkProperty = useUnlinkProperty(leadId);
  const [linkOpen, setLinkOpen] = useState(false);

  const linkedPropertyIds = links?.map((l) => l.property.id) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Propiedades de interés
            {links && links.length > 0 && (
              <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-indigo-700">
                {links.length}
              </span>
            )}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setLinkOpen(true)}
          >
            <Link2 className="mr-1.5 h-3 w-3" />
            Vincular
          </Button>
        </div>

        {(!links || links.length === 0) ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin propiedades vinculadas
          </p>
        ) : (
          <ul className="space-y-2">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex items-start justify-between gap-2 rounded-lg border bg-gray-50 p-3"
              >
                <div
                  className="flex min-w-0 cursor-pointer items-start gap-2"
                  onClick={() => navigate(`/propiedades/${link.property.id}`)}
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 hover:text-indigo-600">
                      {link.property.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-0.5">
                        <DollarSign className="h-3 w-3" />
                        {formatUSD(link.property.price)}
                      </span>
                      {link.property.area != null && (
                        <span className="flex items-center gap-0.5">
                          <Maximize2 className="h-3 w-3" />
                          {link.property.area} m²
                        </span>
                      )}
                      {link.property.bedrooms != null && (
                        <span className="flex items-center gap-0.5">
                          <Bed className="h-3 w-3" />
                          {link.property.bedrooms}
                        </span>
                      )}
                      {link.property.bathrooms != null && (
                        <span className="flex items-center gap-0.5">
                          <Bath className="h-3 w-3" />
                          {link.property.bathrooms}
                        </span>
                      )}
                    </div>
                    {link.notes && (
                      <p className="mt-0.5 text-xs text-gray-400 italic">{link.notes}</p>
                    )}
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 text-gray-400 hover:text-red-500"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Desvincular propiedad?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará el vínculo entre este lead y la propiedad.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => unlinkProperty.mutate({ propertyId: link.property.id })}
                      >
                        Desvincular
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </div>

      <LinkPropertySheet
        leadId={leadId}
        open={linkOpen}
        onOpenChange={setLinkOpen}
        linkedPropertyIds={linkedPropertyIds}
      />
    </>
  );
}
