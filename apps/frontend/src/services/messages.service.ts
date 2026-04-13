import { api } from '@/lib/api';
import type {
  Message,
  SendWhatsAppInput,
  SendEmailInput,
} from '@/types';

export const messagesService = {
  sendWhatsApp: (data: SendWhatsAppInput) =>
    api.post<{ whatsappUrl: string }>('/messages/whatsapp', data),

  sendEmail: (data: SendEmailInput) =>
    api.post<{ success: boolean }>('/messages/email', data),

  getLeadMessages: (leadId: string) =>
    api.get<Message[]>(`/messages/lead/${leadId}`),
};
