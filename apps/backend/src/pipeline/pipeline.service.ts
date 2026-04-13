import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, ActivityType, LeadStatus, Role } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import type { CreateStageDto } from './dto/create-stage.dto';
import type { UpdateStageDto } from './dto/update-stage.dto';
import type { ReorderStagesDto } from './dto/reorder-stages.dto';
import type { CreateChecklistItemDto, UpdateChecklistItemDto } from './dto/checklist-item.dto';
import { ScoringService } from '@/scoring/scoring.service';

const PIPELINE_LEAD_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  source: true,
  status: true,
  budget: true,
  propertyInterest: true,
  nextActionAt: true,
  stageId: true,
  daysInCurrentStage: true,
  assignedTo: { select: { id: true, name: true } },
  score: {
    select: { score: true, temperature: true, urgency: true },
  },
} satisfies Prisma.LeadSelect;

@Injectable()
export class PipelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  // ─── GET /pipeline/stages ────────────────────────────────────────────────────

  async getStages(actor: AuthenticatedUser) {
    return this.prisma.pipelineStage.findMany({
      where: { tenantId: actor.tenantId },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { leads: true, checklists: true } },
        checklists: { orderBy: { order: 'asc' } },
      },
    });
  }

  // ─── POST /pipeline/stages ───────────────────────────────────────────────────

  async createStage(dto: CreateStageDto, actor: AuthenticatedUser) {
    const maxOrder = await this.prisma.pipelineStage.aggregate({
      where: { tenantId: actor.tenantId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? 0) + 1;

    return this.prisma.pipelineStage.create({
      data: {
        name: dto.name,
        color: dto.color ?? '#6B7280',
        probability: dto.probability ?? 0,
        description: dto.description ?? null,
        order,
        tenantId: actor.tenantId,
      },
    });
  }

  // ─── PATCH /pipeline/stages/:id ─────────────────────────────────────────────

  async updateStage(id: string, dto: UpdateStageDto, actor: AuthenticatedUser) {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id, tenantId: actor.tenantId },
    });
    if (!stage) throw new NotFoundException('Etapa no encontrada');

    // If setting as default, clear previous default first
    if (dto.isDefault) {
      await this.prisma.pipelineStage.updateMany({
        where: { tenantId: actor.tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.pipelineStage.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.probability !== undefined && { probability: dto.probability }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  // ─── DELETE /pipeline/stages/:id ────────────────────────────────────────────

  async deleteStage(id: string, actor: AuthenticatedUser) {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id, tenantId: actor.tenantId },
      include: { _count: { select: { leads: true } } },
    });
    if (!stage) throw new NotFoundException('Etapa no encontrada');

    if (stage._count.leads > 0) {
      throw new ConflictException(
        `No se puede eliminar la etapa: tiene ${stage._count.leads} lead(s) asignados`,
      );
    }

    await this.prisma.pipelineStage.delete({ where: { id } });

    // Re-order remaining stages
    const remaining = await this.prisma.pipelineStage.findMany({
      where: { tenantId: actor.tenantId },
      orderBy: { order: 'asc' },
    });

    await Promise.all(
      remaining.map((s, idx) =>
        this.prisma.pipelineStage.update({
          where: { id: s.id },
          data: { order: idx + 1 },
        }),
      ),
    );

    return { deleted: true };
  }

  // ─── PATCH /pipeline/stages/reorder ─────────────────────────────────────────

  async reorderStages(dto: ReorderStagesDto, actor: AuthenticatedUser) {
    const stages = await this.prisma.pipelineStage.findMany({
      where: { tenantId: actor.tenantId },
      select: { id: true },
    });

    const stageIds = new Set(stages.map((s) => s.id));
    for (const id of dto.orderedIds) {
      if (!stageIds.has(id)) throw new BadRequestException(`Stage ${id} not found`);
    }

    await Promise.all(
      dto.orderedIds.map((id, idx) =>
        this.prisma.pipelineStage.update({
          where: { id },
          data: { order: idx + 1 },
        }),
      ),
    );

    return this.getStages(actor);
  }

  // ─── GET /pipeline ───────────────────────────────────────────────────────────

  async getBoard(actor: AuthenticatedUser) {
    const [stages, leads] = await Promise.all([
      this.prisma.pipelineStage.findMany({
        where: { tenantId: actor.tenantId },
        orderBy: { order: 'asc' },
        include: {
          checklists: { select: { id: true } },
        },
      }),
      this.prisma.lead.findMany({
        where: {
          tenantId: actor.tenantId,
          deletedAt: null,
          status: { in: [LeadStatus.ACTIVE, LeadStatus.PAUSED] },
          ...(actor.role === Role.VENDEDOR ? { assignedToId: actor.id } : {}),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          ...PIPELINE_LEAD_SELECT,
          checklistProgress: {
            select: { isDone: true, checklistId: true },
          },
        },
      }),
    ]);

    // Group leads by stageId
    const stageLeads = new Map<string, (typeof leads)[number][]>();
    const unassigned: (typeof leads)[number][] = [];

    for (const stage of stages) {
      stageLeads.set(stage.id, []);
    }

    for (const lead of leads) {
      if (lead.stageId && stageLeads.has(lead.stageId)) {
        stageLeads.get(lead.stageId)!.push(lead);
      } else {
        unassigned.push(lead);
      }
    }

    return {
      stages: stages.map((stage) => ({
        ...stage,
        leads: stageLeads.get(stage.id) ?? [],
      })),
      unassigned,
    };
  }

  // ─── PATCH /pipeline/leads/:id/stage ────────────────────────────────────────

  async moveToStage(
    leadId: string,
    stageId: string | null,
    actor: AuthenticatedUser,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: actor.tenantId,
        deletedAt: null,
        ...(actor.role === Role.VENDEDOR ? { assignedToId: actor.id } : {}),
      },
      include: { stage: true },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    let newStage = null;
    if (stageId !== null) {
      newStage = await this.prisma.pipelineStage.findFirst({
        where: { id: stageId, tenantId: actor.tenantId },
        include: { checklists: true },
      });
      if (!newStage) throw new NotFoundException('Etapa no encontrada');
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Close existing stage history entry
      if (lead.stageId) {
        const openHistory = await tx.leadStageHistory.findFirst({
          where: { leadId, exitedAt: null },
          orderBy: { enteredAt: 'desc' },
        });
        if (openHistory) {
          const daysInStage = Math.floor(
            (now.getTime() - openHistory.enteredAt.getTime()) / (1000 * 60 * 60 * 24),
          );
          await tx.leadStageHistory.update({
            where: { id: openHistory.id },
            data: { exitedAt: now, daysInStage },
          });
        }
      }

      // 2. Create new stage history entry
      if (newStage) {
        await tx.leadStageHistory.create({
          data: {
            tenantId: actor.tenantId,
            leadId,
            stageId: newStage.id,
            stageName: newStage.name,
            enteredAt: now,
          },
        });

        // 3. Create checklist progress entries for new stage
        if (newStage.checklists.length > 0) {
          // Only create entries that don't exist yet
          const existingProgress = await tx.leadChecklistProgress.findMany({
            where: {
              leadId,
              checklistId: { in: newStage.checklists.map((c) => c.id) },
            },
            select: { checklistId: true },
          });
          const existingIds = new Set(existingProgress.map((p) => p.checklistId));
          const toCreate = newStage.checklists.filter((c) => !existingIds.has(c.id));

          if (toCreate.length > 0) {
            await tx.leadChecklistProgress.createMany({
              data: toCreate.map((c) => ({
                leadId,
                checklistId: c.id,
                isDone: false,
              })),
            });
          }
        }
      }

      // 4. Update lead
      const updated = await tx.lead.update({
        where: { id: leadId },
        data: { stageId, daysInCurrentStage: 0 },
        select: PIPELINE_LEAD_SELECT,
      });

      // 5. Activity log
      await tx.activity.create({
        data: {
          type: ActivityType.STAGE_CHANGED,
          description: `Etapa cambiada: ${lead.stage?.name ?? 'Sin etapa'} → ${newStage?.name ?? 'Sin etapa'}`,
          metadata: {
            previousStageId: lead.stageId,
            newStageId: stageId,
            previousStageName: lead.stage?.name ?? null,
            newStageName: newStage?.name ?? null,
          },
          leadId,
          userId: actor.id,
          tenantId: actor.tenantId,
        },
      });

      return updated;
    }).then((result) => {
      // Fire-and-forget score recalculation on stage change
      void this.scoring.calculateScore(leadId, actor.tenantId);
      return result;
    });
  }

  // ─── Checklist endpoints ─────────────────────────────────────────────────────

  async getStageChecklists(stageId: string, actor: AuthenticatedUser) {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, tenantId: actor.tenantId },
    });
    if (!stage) throw new NotFoundException('Etapa no encontrada');

    return this.prisma.stageChecklist.findMany({
      where: { stageId },
      orderBy: { order: 'asc' },
    });
  }

  async createChecklistItem(
    stageId: string,
    dto: CreateChecklistItemDto,
    actor: AuthenticatedUser,
  ) {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, tenantId: actor.tenantId },
    });
    if (!stage) throw new NotFoundException('Etapa no encontrada');

    const maxOrder = await this.prisma.stageChecklist.aggregate({
      where: { stageId },
      _max: { order: true },
    });

    return this.prisma.stageChecklist.create({
      data: {
        stageId,
        tenantId: actor.tenantId,
        text: dto.text,
        order: dto.order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });
  }

  async updateChecklistItem(
    stageId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
    actor: AuthenticatedUser,
  ) {
    const item = await this.prisma.stageChecklist.findFirst({
      where: { id: itemId, stageId, tenantId: actor.tenantId },
    });
    if (!item) throw new NotFoundException('Item no encontrado');

    return this.prisma.stageChecklist.update({
      where: { id: itemId },
      data: {
        ...(dto.text !== undefined && { text: dto.text }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  async deleteChecklistItem(stageId: string, itemId: string, actor: AuthenticatedUser) {
    const item = await this.prisma.stageChecklist.findFirst({
      where: { id: itemId, stageId, tenantId: actor.tenantId },
    });
    if (!item) throw new NotFoundException('Item no encontrado');

    await this.prisma.stageChecklist.delete({ where: { id: itemId } });
    return { deleted: true };
  }

  // ─── Lead checklist progress ─────────────────────────────────────────────────

  async getLeadChecklist(leadId: string, actor: AuthenticatedUser) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId: actor.tenantId, deletedAt: null },
      select: { stageId: true },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');
    if (!lead.stageId) return [];

    const checklists = await this.prisma.stageChecklist.findMany({
      where: { stageId: lead.stageId },
      orderBy: { order: 'asc' },
    });

    const progress = await this.prisma.leadChecklistProgress.findMany({
      where: {
        leadId,
        checklistId: { in: checklists.map((c) => c.id) },
      },
    });

    const progressMap = new Map(progress.map((p) => [p.checklistId, p]));

    return checklists.map((c) => ({
      id: c.id,
      text: c.text,
      order: c.order,
      isDone: progressMap.get(c.id)?.isDone ?? false,
      doneAt: progressMap.get(c.id)?.doneAt ?? null,
      progressId: progressMap.get(c.id)?.id ?? null,
    }));
  }

  async toggleLeadChecklistItem(
    leadId: string,
    checklistId: string,
    isDone: boolean,
    actor: AuthenticatedUser,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId: actor.tenantId, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    const checklist = await this.prisma.stageChecklist.findFirst({
      where: { id: checklistId, tenantId: actor.tenantId },
    });
    if (!checklist) throw new NotFoundException('Checklist item no encontrado');

    const result = await this.prisma.leadChecklistProgress.upsert({
      where: { leadId_checklistId: { leadId, checklistId } },
      create: {
        leadId,
        checklistId,
        isDone,
        doneAt: isDone ? new Date() : null,
      },
      update: {
        isDone,
        doneAt: isDone ? new Date() : null,
      },
    });

    // Fire-and-forget score recalculation on checklist change
    void this.scoring.calculateScore(leadId, actor.tenantId);

    return result;
  }

  // ─── Lead stage history ──────────────────────────────────────────────────────

  async getLeadStageHistory(leadId: string, actor: AuthenticatedUser) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId: actor.tenantId, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    return this.prisma.leadStageHistory.findMany({
      where: { leadId },
      orderBy: { enteredAt: 'asc' },
      include: {
        stage: { select: { id: true, name: true, color: true } },
      },
    });
  }
}
