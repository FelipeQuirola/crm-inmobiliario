import { api } from '@/lib/api';
import type {
  Template,
  TemplatePreview,
  CreateTemplateInput,
  UpdateTemplateInput,
  ListTemplatesParams,
} from '@/types';

export const templatesService = {
  list: (params?: ListTemplatesParams) =>
    api.get<Template[]>('/templates', { params }),

  preview: (id: string, leadId?: string) =>
    api.get<TemplatePreview>(`/templates/${id}/preview`, {
      params: leadId ? { leadId } : undefined,
    }),

  create: (data: CreateTemplateInput) =>
    api.post<Template>('/templates', data),

  update: (id: string, data: UpdateTemplateInput) =>
    api.patch<Template>(`/templates/${id}`, data),

  deactivate: (id: string) =>
    api.delete<Template>(`/templates/${id}`),
};
