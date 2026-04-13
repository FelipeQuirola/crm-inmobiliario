import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { LeadStatus, NotificationType, Role } from '@prisma/client';

export const CHECK_INACTIVE_JOB = 'check-inactive-leads';
export const CHECK_OVERDUE_JOB = 'check-overdue-actions';
export const CHECK_MEETINGS_JOB = 'check-meeting-reminders';

@Processor('reminders')
export class RemindersProcessor {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Job 1: Inactive leads ───────────────────────────────────────────────

  @Process(CHECK_INACTIVE_JOB)
  async handleInactiveLeads(_job: Job): Promise<void> {
    this.logger.log('Running checkInactiveLeads job');
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const leads = await this.prisma.lead.findMany({
      where: {
        status: LeadStatus.ACTIVE,
        deletedAt: null,
        OR: [
          // Has had contact, but it was > 3 days ago
          { lastContactAt: { lt: threeDaysAgo } },
          // Never had contact and was created > 1 day ago
          { lastContactAt: null, createdAt: { lt: oneDayAgo } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        assignedToId: true,
        lastContactAt: true,
      },
    });

    for (const lead of leads) {
      const type = lead.lastContactAt === null
        ? NotificationType.LEAD_UNCONTACTED
        : NotificationType.LEAD_INACTIVE;

      const recipientIds = await this.resolveRecipients(
        lead.assignedToId,
        lead.tenantId,
      );

      for (const userId of recipientIds) {
        const alreadyNotified = await this.notifications.existsRecent({
          userId,
          leadId: lead.id,
          type,
        });
        if (alreadyNotified) continue;

        const leadName = `${lead.firstName} ${lead.lastName}`;
        await this.notifications.create({
          tenantId: lead.tenantId,
          userId,
          leadId: lead.id,
          type,
          title:
            type === NotificationType.LEAD_UNCONTACTED
              ? 'Lead sin contactar'
              : 'Lead inactivo',
          message:
            type === NotificationType.LEAD_UNCONTACTED
              ? `${leadName} lleva más de 1 día sin ser contactado.`
              : `${leadName} lleva más de 3 días sin actividad.`,
        });
      }
    }

    this.logger.log(`checkInactiveLeads: processed ${leads.length} leads`);
  }

  // ─── Job 2: Overdue actions ──────────────────────────────────────────────

  @Process(CHECK_OVERDUE_JOB)
  async handleOverdueActions(_job: Job): Promise<void> {
    this.logger.log('Running checkOverdueActions job');
    const now = new Date();

    const leads = await this.prisma.lead.findMany({
      where: {
        status: LeadStatus.ACTIVE,
        deletedAt: null,
        nextActionAt: { lt: now },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        assignedToId: true,
        nextActionAt: true,
      },
    });

    for (const lead of leads) {
      const recipientIds = await this.resolveRecipients(
        lead.assignedToId,
        lead.tenantId,
      );

      for (const userId of recipientIds) {
        const alreadyNotified = await this.notifications.existsRecent({
          userId,
          leadId: lead.id,
          type: NotificationType.ACTION_OVERDUE,
        });
        if (alreadyNotified) continue;

        const leadName = `${lead.firstName} ${lead.lastName}`;
        await this.notifications.create({
          tenantId: lead.tenantId,
          userId,
          leadId: lead.id,
          type: NotificationType.ACTION_OVERDUE,
          title: 'Acción vencida',
          message: `La próxima acción de ${leadName} está vencida.`,
        });
      }
    }

    this.logger.log(`checkOverdueActions: processed ${leads.length} leads`);
  }

  // ─── Job 3: Meeting reminders ─────────────────────────────────────────────

  @Process(CHECK_MEETINGS_JOB)
  async handleMeetingReminders(_job: Job): Promise<void> {
    this.logger.log('Running checkMeetingReminders job');
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        status: 'PENDING',
        startAt: { gte: now, lte: inOneHour },
      },
      select: {
        id: true,
        title: true,
        startAt: true,
        userId: true,
        tenantId: true,
        leadId: true,
      },
    });

    for (const event of events) {
      const alreadyNotified = await this.notifications.existsRecent({
        userId: event.userId,
        leadId: event.leadId ?? undefined,
        type: NotificationType.MEETING_REMINDER,
      });
      if (alreadyNotified) continue;

      const minutesLeft = Math.round(
        (event.startAt.getTime() - now.getTime()) / 60000,
      );

      await this.notifications.create({
        tenantId: event.tenantId,
        userId: event.userId,
        leadId: event.leadId ?? undefined,
        type: NotificationType.MEETING_REMINDER,
        title: 'Recordatorio de reunión',
        message: `"${event.title}" comienza en ${minutesLeft} minutos.`,
      });
    }

    this.logger.log(`checkMeetingReminders: processed ${events.length} events`);
  }

  // ─── Helper: resolve notification recipients ──────────────────────────────

  private async resolveRecipients(
    assignedToId: string | null,
    tenantId: string,
  ): Promise<string[]> {
    if (assignedToId) return [assignedToId];

    // No assignee → notify all admins of the tenant
    const admins = await this.prisma.user.findMany({
      where: { tenantId, role: Role.ADMIN, isActive: true },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }
}
