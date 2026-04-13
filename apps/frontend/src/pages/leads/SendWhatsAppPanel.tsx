import { useState, useEffect } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useTemplates, useSendWhatsApp } from '@/hooks/useTemplates';
import { resolveTemplate } from '@/lib/resolve-template';
import { toast } from 'sonner';
import type { LeadDetail } from '@/types';

const MAX_CHARS = 4096;

interface SendWhatsAppPanelProps {
  lead: LeadDetail;
}

export function SendWhatsAppPanel({ lead }: SendWhatsAppPanelProps) {
  const { data: templates = [] } = useTemplates({ type: 'WHATSAPP' });
  const sendWA = useSendWhatsApp();

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [body, setBody] = useState('');

  // Auto-fill body when a template is selected
  useEffect(() => {
    if (!selectedTemplateId) { setBody(''); return; }
    const tmpl = templates.find((t) => t.id === selectedTemplateId);
    if (tmpl) setBody(resolveTemplate(tmpl.body, lead));
  }, [selectedTemplateId, templates, lead]);

  const handleSend = async () => {
    if (!body.trim()) return;
    try {
      const result = await sendWA.mutateAsync({
        leadId:     lead.id,
        templateId: selectedTemplateId || undefined,
        body:       body.trim(),
      });
      window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
      toast.success('WhatsApp preparado — presiona Enviar en la app');
    } catch {
      toast.error('Error al preparar el mensaje');
    }
  };

  return (
    <div className="space-y-3">
      {/* Template selector */}
      {templates.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Plantilla (opcional)</p>
          <Select
            value={selectedTemplateId || '__none__'}
            onValueChange={(v) => setSelectedTemplateId(v === '__none__' ? '' : v)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Sin plantilla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin plantilla</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Message body */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Mensaje</p>
          <span className={`text-xs ${body.length > MAX_CHARS ? 'text-red-500' : 'text-muted-foreground'}`}>
            {body.length}/{MAX_CHARS}
          </span>
        </div>
        <Textarea
          rows={5}
          className="resize-none text-sm"
          placeholder="Hola, te contactamos desde..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      {/* Info note */}
      <div className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
        <p className="text-xs text-green-700 leading-relaxed">
          Se abrirá WhatsApp Web / App con el mensaje pre-cargado.
          Deberás presionar <strong>Enviar</strong> manualmente.
        </p>
      </div>

      <Button
        className="w-full bg-green-600 hover:bg-green-700"
        onClick={handleSend}
        disabled={!body.trim() || body.length > MAX_CHARS || sendWA.isPending}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        {sendWA.isPending ? 'Preparando...' : 'Abrir WhatsApp'}
      </Button>
    </div>
  );
}
