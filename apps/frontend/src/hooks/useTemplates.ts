import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesService } from '@/services/templates.service';
import { messagesService } from '@/services/messages.service';
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  ListTemplatesParams,
  SendWhatsAppInput,
  SendEmailInput,
} from '@/types';

export const TEMPLATES_KEY = 'templates';
export const MESSAGES_KEY  = 'messages';

// ─── Templates ────────────────────────────────────────────────────────────────

export function useTemplates(params?: ListTemplatesParams) {
  return useQuery({
    queryKey: [TEMPLATES_KEY, params],
    queryFn:  () => templatesService.list(params).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTemplateInput) => templatesService.create(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }); },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateInput }) =>
      templatesService.update(id, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }); },
  });
}

export function useDeactivateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templatesService.deactivate(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }); },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useLeadMessages(leadId: string) {
  return useQuery({
    queryKey: [MESSAGES_KEY, leadId],
    queryFn:  () => messagesService.getLeadMessages(leadId).then((r) => r.data),
    enabled:  !!leadId,
    staleTime: 1000 * 30,
  });
}

export function useSendWhatsApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendWhatsAppInput) =>
      messagesService.sendWhatsApp(data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: [MESSAGES_KEY, variables.leadId] });
      void qc.invalidateQueries({ queryKey: ['activities', variables.leadId] });
      void qc.invalidateQueries({ queryKey: ['leads', variables.leadId] });
    },
  });
}

export function useSendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendEmailInput) =>
      messagesService.sendEmail(data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: [MESSAGES_KEY, variables.leadId] });
      void qc.invalidateQueries({ queryKey: ['activities', variables.leadId] });
      void qc.invalidateQueries({ queryKey: ['leads', variables.leadId] });
    },
  });
}
