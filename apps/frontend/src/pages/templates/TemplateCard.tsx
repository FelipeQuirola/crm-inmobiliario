import { useState } from 'react';
import { Eye, Pencil, PowerOff, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeactivateTemplate } from '@/hooks/useTemplates';
import { TemplateFormSheet } from './TemplateFormSheet';
import { TemplatePreviewSheet } from './TemplatePreviewSheet';
import type { Template } from '@/types';

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const deactivate = useDeactivateTemplate();
  const [editOpen,    setEditOpen]    = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isWA = template.type === 'WHATSAPP';

  return (
    <>
      <div className="flex flex-col rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
              isWA ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {isWA
                ? <MessageCircle className="h-4 w-4 text-green-600" />
                : <Mail className="h-4 w-4 text-blue-600" />
              }
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{template.name}</p>
              <span className={`text-xs font-medium ${isWA ? 'text-green-600' : 'text-blue-600'}`}>
                {isWA ? 'WhatsApp' : 'Email'}
              </span>
            </div>
          </div>
        </div>

        {/* Subject (email only) */}
        {template.type === 'EMAIL' && template.subject && (
          <p className="mb-1 text-xs font-medium text-muted-foreground truncate">
            {template.subject}
          </p>
        )}

        {/* Body preview */}
        <p className="flex-1 text-sm text-gray-600 line-clamp-3 leading-relaxed">
          {template.body}
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-1.5 border-t pt-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="mr-1 h-3 w-3" />
            Preview
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-1 h-3 w-3" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setConfirmOpen(true)}
          >
            <PowerOff className="mr-1 h-3 w-3" />
            Desactivar
          </Button>
        </div>
      </div>

      <TemplateFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        template={template}
      />

      <TemplatePreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        template={template}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              La plantilla «{template.name}» dejará de aparecer en las listas.
              Esta acción se puede revertir manualmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deactivate.mutate(template.id)}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
