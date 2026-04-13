import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useTemplates, useSendEmail } from '@/hooks/useTemplates';
import { resolveTemplate } from '@/lib/resolve-template';
import { toast } from 'sonner';
import type { LeadDetail } from '@/types';

interface SendEmailPanelProps {
  lead: LeadDetail;
}

export function SendEmailPanel({ lead }: SendEmailPanelProps) {
  const { data: templates = [] } = useTemplates({ type: 'EMAIL' });
  const sendEmail = useSendEmail();

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body,    setBody]    = useState('');

  // Auto-fill when template is selected
  useEffect(() => {
    if (!selectedTemplateId) { setSubject(''); setBody(''); return; }
    const tmpl = templates.find((t) => t.id === selectedTemplateId);
    if (tmpl) {
      setSubject(tmpl.subject ? resolveTemplate(tmpl.subject, lead) : '');
      setBody(resolveTemplate(tmpl.body, lead));
    }
  }, [selectedTemplateId, templates, lead]);

  const canSend = subject.trim() && body.trim() && !!lead.email;

  const handleSend = async () => {
    if (!canSend) return;
    try {
      await sendEmail.mutateAsync({
        leadId:     lead.id,
        templateId: selectedTemplateId || undefined,
        subject:    subject.trim(),
        body:       body.trim(),
      });
      toast.success('Email enviado correctamente');
      setSubject('');
      setBody('');
      setSelectedTemplateId('');
    } catch {
      toast.error('Error al enviar el email');
    }
  };

  return (
    <div className="space-y-3">
      {!lead.email && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">
            Este lead no tiene email registrado. Agrégalo en la información del lead para poder enviar emails.
          </p>
        </div>
      )}

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

      {/* Subject */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Asunto *</p>
        <Input
          placeholder="Asunto del email"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="text-sm"
          disabled={!lead.email}
        />
      </div>

      {/* Body */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Mensaje *</p>
        <Textarea
          rows={6}
          className="resize-none text-sm"
          placeholder="Contenido del email..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={!lead.email}
        />
      </div>

      <Button
        className="w-full"
        onClick={handleSend}
        disabled={!canSend || sendEmail.isPending}
      >
        <Send className="mr-2 h-4 w-4" />
        {sendEmail.isPending ? 'Enviando...' : 'Enviar email'}
      </Button>
    </div>
  );
}
