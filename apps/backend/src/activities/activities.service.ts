import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, CalendarEventType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ListActivitiesDto } from './dto/list-activities.dto';
import { ScoringService } from '@/scoring/scoring.service';

// Automatic activity types — cannot be deleted by users
const AUTOMATIC_TYPES: ActivityType[] = [
  ActivityType.LEAD_CREATED,
  ActivityType.STAGE_CHANGED,
  ActivityType.REASSIGNED,
  ActivityType.STATUS_CHANGED,
];

const ACTIVITY_SELECT = {
  id: true,
  type: true,
  description: true,
  metadata: true,
  createdAt: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.ActivitySelect;

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(
    leadId: string,
    dto: CreateActivityDto,
    actor: AuthenticatedUser,
  ) {
    const lead = await this.assertLeadAccess(leadId, actor);

    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.activity.create({
        data: {
          type: dto.type,
          description: dto.description,
          metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          leadId,
          userId: actor.id,
          tenantId: actor.tenantId,
        },
        select: ACTIVITY_SELECT,
      });

      // Always update lastContactAt
      await tx.lead.update({
        where: { id: leadId },
        data: { lastContactAt: new Date() },
      });

      // Create a calendar event for meetings
      if (dto.type === ActivityType.MEETING) {
        const startAt = dto.metadata?.scheduledAt
          ? new Date(dto.metadata.scheduledAt)
          : new Date();
        const endAt = new Date(startAt.getTime() + 60 * 60 * 1000); // +1 hour

        await tx.calendarEvent.create({
          data: {
            title: dto.description,
            startAt,
            endAt,
            type: CalendarEventType.MEETING,
            leadId,
            userId: actor.id,
            tenantId: actor.tenantId,
          },
        });
      }

      void lead; // silence unused var warning

      return activity;
    }).then((activity) => {
      // Fire-and-forget score recalculation after each activity
      void this.scoring.calculateScore(leadId, actor.tenantId);
      return activity;
    });
  }

  // ─── LIST ─────────────────────────────────────────────────────────────────

  async list(
    leadId: string,
    dto: ListActivitiesDto,
    actor: AuthenticatedUser,
  ) {
    await this.assertLeadAccess(leadId, actor);

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = { leadId, tenantId: actor.tenantId };

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: ACTIVITY_SELECT,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { data, total, page, limit, hasMore: skip + data.length < total };
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(
    leadId: string,
    activityId: string,
    actor: AuthenticatedUser,
  ) {
    await this.assertLeadAccess(leadId, actor);

    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, leadId, tenantId: actor.tenantId },
    });
    if (!activity) throw new NotFoundException('Actividad no encontrada');

    if (AUTOMATIC_TYPES.includes(activity.type)) {
      throw new ForbiddenException(
        'No se pueden eliminar actividades automáticas del sistema',
      );
    }

    if (actor.role !== Role.ADMIN && activity.userId !== actor.id) {
      throw new ForbiddenException(
        'Solo el autor o un administrador puede eliminar esta actividad',
      );
    }

    await this.prisma.activity.delete({ where: { id: activityId } });
  }

  // ─── PRIVATE ──────────────────────────────────────────────────────────────

  private async assertLeadAccess(leadId: string, actor: AuthenticatedUser) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: actor.tenantId,
        deletedAt: null,
        ...(actor.role === Role.VENDEDOR ? { assignedToId: actor.id } : {}),
      },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');
    return lead;
  }
}
