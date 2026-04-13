import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadSearchInput } from '@/components/LeadSearchInput';
import { templatesService } from '@/services/templates.service';
import type { Template } from '@/types';

interface TemplatePreviewSheetProps {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  template:     Template;
}

export function TemplatePreviewSheet({ open, onOpenChange, template }: TemplatePreviewSheetProps) {
  const [leadId, setLeadId] = useState('');

  const { data: preview, isLoading } = useQuery({
    queryKey: ['template-preview', template.id, leadId],
    queryFn:  () => templatesService.preview(template.id, leadId || undefined).then((r) => r.data),
    enabled:  open,
    staleTime: 1000 * 30,
  });

  // If no lead selected: show raw body with variables intact
  const displayBody    = preview?.resolvedBody    ?? template.body;
  const displaySubject = preview?.resolvedSubject ?? template.subject ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Vista previa — {template.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* Lead selector for real-data preview */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Previsualizar con datos de un lead (opcional)</p>
            <LeadSearchInput value={leadId} onChange={setLeadId} />
            {!leadId && (
              <p className="text-xs text-muted-foreground">
                Sin lead seleccionado se muestran las variables sin resolver.
              </p>
            )}
          </div>

          {/* Type badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              template.type === 'WHATSAPP'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {template.type === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
            </span>
          </div>

          {/* Subject (email only) */}
          {template.type === 'EMAIL' && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Asunto
              </p>
              {isLoading ? (
                <Skeleton className="h-5 w-48" />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {displaySubject ?? <span className="text-muted-foreground italic">Sin asunto</span>}
                </p>
              )}
            </div>
          )}

          {/* Body */}
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Mensaje
            </p>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : (
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {displayBody}
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
