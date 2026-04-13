import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityType,
  CalendarEventType,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { ChangeEventStatusDto } from './dto/change-event-status.dto';
import { ListCalendarEventsDto } from './dto/list-calendar-events.dto';

const EVENT_SELECT = {
  id: true,
  title: true,
  description: true,
  startAt: true,
  endAt: true,
  type: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true } },
  lead: { select: { id: true, firstName: true, lastName: true, phone: true } },
} satisfies Prisma.CalendarEventSelect;

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── LIST ─────────────────────────────────────────────────────────────────

  async list(actor: AuthenticatedUser, dto: ListCalendarEventsDto) {
    // VENDEDOR can only see their own events
    const userId =
      actor.role === Role.ADMIN && dto.assignedToId
        ? dto.assignedToId
        : actor.id;

    return this.prisma.calendarEvent.findMany({
      where: {
        tenantId: actor.tenantId,
        userId,
        startAt: { gte: new Date(dto.startDate) },
        endAt:   { lte: new Date(dto.endDate) },
      },
      select: EVENT_SELECT,
      orderBy: { startAt: 'asc' },
    });
  }

  // ─── TODAY ────────────────────────────────────────────────────────────────

  async today(actor: AuthenticatedUser) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return this.prisma.calendarEvent.findMany({
      where: {
        tenantId: actor.tenantId,
        userId: actor.id,
        startAt: { gte: start, lte: end },
      },
      select: EVENT_SELECT,
      orderBy: { startAt: 'asc' },
    });
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(actor: AuthenticatedUser, dto: CreateCalendarEventDto) {
    // VENDEDOR can only create for themselves
    const userId =
      actor.role === Role.ADMIN && dto.assignedToId
        ? dto.assignedToId
        : actor.id;

    // Validate lead belongs to tenant if provided
    if (dto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId, tenantId: actor.tenantId, deletedAt: null },
      });
      if (!lead) throw new NotFoundException('Lead no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const event = await tx.calendarEvent.create({
        data: {
          title:       dto.title,
          description: dto.description,
          type:        dto.type,
          startAt:     new Date(dto.startAt),
          endAt:       new Date(dto.endAt),
          leadId:      dto.leadId,
          userId,
          tenantId:    actor.tenantId,
        },
        select: EVENT_SELECT,
      });

      // Register activity in lead's bitácora if lead is linked and type matches
      if (dto.leadId && (dto.type === CalendarEventType.MEETING || dto.type === CalendarEventType.CALL)) {
        const activityType =
          dto.type === CalendarEventType.MEETING
            ? ActivityType.MEETING
            : ActivityType.CALL;

        await tx.activity.create({
          data: {
            type:        activityType,
            description: dto.title,
            metadata:    { scheduledAt: dto.startAt } as Prisma.InputJsonValue,
            leadId:      dto.leadId,
            userId:      actor.id,
            tenantId:    actor.tenantId,
          },
        });

        // Update lastContactAt on lead
        await tx.lead.update({
          where: { id: dto.leadId },
          data: { lastContactAt: new Date() },
        });
      }

      return event;
    });
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(actor: AuthenticatedUser, id: string, dto: UpdateCalendarEventDto) {
    const event = await this.assertAccess(actor, id);

    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(dto.title       !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type        !== undefined && { type: dto.type }),
        ...(dto.startAt     !== undefined && { startAt: new Date(dto.startAt) }),
        ...(dto.endAt       !== undefined && { endAt:   new Date(dto.endAt) }),
        ...(dto.leadId      !== undefined && { leadId:  dto.leadId || null }),
      },
      select: EVENT_SELECT,
    });
  }

  // ─── CHANGE STATUS ────────────────────────────────────────────────────────

  async changeStatus(actor: AuthenticatedUser, id: string, dto: ChangeEventStatusDto) {
    await this.assertAccess(actor, id);

    return this.prisma.calendarEvent.update({
      where: { id },
      data: { status: dto.status },
      select: EVENT_SELECT,
    });
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(actor: AuthenticatedUser, id: string) {
    await this.assertAccess(actor, id);
    await this.prisma.calendarEvent.delete({ where: { id } });
  }

  // ─── PRIVATE ──────────────────────────────────────────────────────────────

  private async assertAccess(actor: AuthenticatedUser, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, tenantId: actor.tenantId },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    if (actor.role !== Role.ADMIN && event.userId !== actor.id) {
      throw new ForbiddenException('No tienes permiso para modificar este evento');
    }

    return event;
  }
}
