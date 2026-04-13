import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, MessageStatus, MessageType, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { SendWhatsAppDto } from './dto/send-whatsapp.dto';
import { SendEmailDto } from './dto/send-email.dto';

const MESSAGE_SELECT = {
  id:        true,
  type:      true,
  subject:   true,
  body:      true,
  status:    true,
  sentAt:    true,
  createdAt: true,
  user:      { select: { id: true, name: true } },
  template:  { select: { id: true, name: true } },
} satisfies Prisma.MessageSelect;

const LEAD_SELECT = {
  id:              true,
  firstName:       true,
  lastName:        true,
  phoneNormalized: true,
  email:           true,
} satisfies Prisma.LeadSelect;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── SEND WHATSAPP ─────────────────────────────────────────────────────────

  async sendWhatsApp(actor: AuthenticatedUser, dto: SendWhatsAppDto) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: dto.leadId, tenantId: actor.tenantId, deletedAt: null },
      select: LEAD_SELECT,
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    const whatsappUrl = `https://wa.me/${lead.phoneNormalized}?text=${encodeURIComponent(dto.body)}`;

    await this.prisma.$transaction(async (tx) => {
      // Create and immediately mark as SENT (manual open by user)
      const message = await tx.message.create({
        data: {
          tenantId:   actor.tenantId,
          leadId:     dto.leadId,
          userId:     actor.id,
          type:       MessageType.WHATSAPP,
          templateId: dto.templateId ?? null,
          body:       dto.body,
          status:     MessageStatus.SENT,
          sentAt:     new Date(),
        },
      });

      // Register activity
      await tx.activity.create({
        data: {
          type:        ActivityType.WHATSAPP,
          description: dto.body.length > 100 ? dto.body.slice(0, 100) + '…' : dto.body,
          leadId:      dto.leadId,
          userId:      actor.id,
          tenantId:    actor.tenantId,
        },
      });

      // Update lastContactAt
      await tx.lead.update({
        where: { id: dto.leadId },
        data:  { lastContactAt: new Date() },
      });

      return message;
    });

    return { whatsappUrl };
  }

  // ─── SEND EMAIL ────────────────────────────────────────────────────────────

  async sendEmail(actor: AuthenticatedUser, dto: SendEmailDto) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: dto.leadId, tenantId: actor.tenantId, deletedAt: null },
      select: LEAD_SELECT,
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    await this.prisma.$transaction(async (tx) => {
      // Simulate send — mark SENT immediately (real integration = SendGrid)
      await tx.message.create({
        data: {
          tenantId:   actor.tenantId,
          leadId:     dto.leadId,
          userId:     actor.id,
          type:       MessageType.EMAIL,
          templateId: dto.templateId ?? null,
          subject:    dto.subject,
          body:       dto.body,
          status:     MessageStatus.SENT,
          sentAt:     new Date(),
        },
      });

      // Register activity
      await tx.activity.create({
        data: {
          type:        ActivityType.EMAIL,
          description: dto.subject,
          leadId:      dto.leadId,
          userId:      actor.id,
          tenantId:    actor.tenantId,
        },
      });

      // Update lastContactAt
      await tx.lead.update({
        where: { id: dto.leadId },
        data:  { lastContactAt: new Date() },
      });
    });

    return { success: true };
  }

  // ─── LEAD HISTORY ──────────────────────────────────────────────────────────

  async getLeadMessages(actor: AuthenticatedUser, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId: actor.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    return this.prisma.message.findMany({
      where:   { leadId, tenantId: actor.tenantId },
      select:  MESSAGE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }
}
