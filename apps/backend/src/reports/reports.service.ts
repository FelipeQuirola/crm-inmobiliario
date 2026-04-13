import { Injectable } from '@nestjs/common';
import { ActivityType, LeadStatus, Role } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { ReportsQueryDto, TimelineQueryDto } from './dto/reports-query.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function defaultRange(dto: ReportsQueryDto): { start: Date; end: Date } {
  const now = new Date();
  const start = dto.startDate
    ? new Date(dto.startDate)
    : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const end = dto.endDate ? new Date(dto.endDate) : now;
  return { start, end };
}

function msTodays(ms: number): number {
  return ms / (1000 * 60 * 60 * 24);
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── OVERVIEW ───────────────────────────────────────────────────────────────

  async overview(actor: AuthenticatedUser, dto: ReportsQueryDto) {
    const tenantId = actor.tenantId;
    const { start, end } = defaultRange(dto);
    const baseWhere = { tenantId, deletedAt: null as null };

    const [
      totalLeads,
      newLeads,
      activeLeads,
      wonLeads,
      lostLeads,
      pausedLeads,
      stages,
      activityGroups,
      wonAgg,
      activeAgg,
      wonForTime,
    ] = await Promise.all([
      this.prisma.lead.count({ where: baseWhere }),
      this.prisma.lead.count({ where: { ...baseWhere, createdAt: { gte: start, lte: end } } }),
      this.prisma.lead.count({ where: { ...baseWhere, status: LeadStatus.ACTIVE } }),
      this.prisma.lead.count({ where: { ...baseWhere, status: LeadStatus.WON } }),
      this.prisma.lead.count({ where: { ...baseWhere, status: LeadStatus.LOST } }),
      this.prisma.lead.count({ where: { ...baseWhere, status: LeadStatus.PAUSED } }),
      this.prisma.pipelineStage.findMany({
        where: { tenantId },
        orderBy: { order: 'asc' },
        select: { id: true, order: true },
      }),
      this.prisma.activity.groupBy({
        by: ['type'],
        where: { tenantId, createdAt: { gte: start, lte: end } },
        _count: { type: true },
      }),
      this.prisma.lead.aggregate({
        where: { ...baseWhere, status: LeadStatus.WON },
        _sum: { budget: true },
        _avg: { budget: true },
      }),
      this.prisma.lead.aggregate({
        where: { ...baseWhere, status: LeadStatus.ACTIVE },
        _sum: { budget: true },
      }),
      this.prisma.lead.findMany({
        where: { ...baseWhere, status: LeadStatus.WON },
        select: { createdAt: true, updatedAt: true },
      }),
    ]);

    // Stage-by-stage lead counts
    const stageLeadCounts = await Promise.all(
      stages.map((s) =>
        this.prisma.lead.count({ where: { ...baseWhere, stageId: s.id } }),
      ),
    );

    // Activity map
    const actMap: Partial<Record<ActivityType, number>> = {};
    for (const g of activityGroups) {
      actMap[g.type] = g._count.type;
    }

    // Avg time to close (days)
    let avgTimeToClose = 0;
    if (wonForTime.length > 0) {
      const totalDays = wonForTime.reduce(
        (sum, l) => sum + msTodays(l.updatedAt.getTime() - l.createdAt.getTime()),
        0,
      );
      avgTimeToClose = Math.round(totalDays / wonForTime.length);
    }

    // Funnel conversion rates
    const total = totalLeads;
    const won = wonLeads;
    let leadToOportunidad = 0;
    let oportunidadToCalificacion = 0;
    let calificacionToCierre = 0;
    const overallRate = total > 0 ? round1((won / total) * 100) : 0;

    if (stages.length >= 2 && total > 0) {
      const atS2Plus = stageLeadCounts.slice(1).reduce((a, b) => a + b, 0) + won;
      leadToOportunidad = round1((atS2Plus / total) * 100);

      if (stages.length >= 3 && atS2Plus > 0) {
        const atS3Plus = stageLeadCounts.slice(2).reduce((a, b) => a + b, 0) + won;
        oportunidadToCalificacion = round1((atS3Plus / atS2Plus) * 100);

        if (stages.length >= 4 && atS3Plus > 0) {
          const atS4Plus = stageLeadCounts.slice(3).reduce((a, b) => a + b, 0) + won;
          calificacionToCierre = round1((atS4Plus / atS3Plus) * 100);
        }
      }
    }

    return {
      leads: {
        total: totalLeads,
        new: newLeads,
        active: activeLeads,
        won: wonLeads,
        lost: lostLeads,
        paused: pausedLeads,
      },
      conversion: {
        leadToOportunidad,
        oportunidadToCalificacion,
        calificacionToCierre,
        overallRate,
      },
      revenue: {
        totalWon:    Number(wonAgg._sum.budget ?? 0),
        averageDeal: Number(wonAgg._avg.budget ?? 0),
        pipeline:    Number(activeAgg._sum.budget ?? 0),
      },
      activities: {
        total:    activityGroups.reduce((s, g) => s + g._count.type, 0),
        calls:    actMap[ActivityType.CALL]     ?? 0,
        meetings: actMap[ActivityType.MEETING]  ?? 0,
        emails:   actMap[ActivityType.EMAIL]    ?? 0,
        whatsapp: actMap[ActivityType.WHATSAPP] ?? 0,
      },
      avgTimeToClose,
    };
  }

  // ─── BY STAGE ───────────────────────────────────────────────────────────────

  async byStage(actor: AuthenticatedUser) {
    const tenantId = actor.tenantId;

    const stages = await this.prisma.pipelineStage.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, color: true, order: true },
    });

    const stageResults = await Promise.all(
      stages.map(async (stage) => {
        const count = await this.prisma.lead.count({
          where: { tenantId, stageId: stage.id, deletedAt: null },
        });
        return { stage, count };
      }),
    );

    // Leads with no stage
    const noStageCount = await this.prisma.lead.count({
      where: { tenantId, stageId: null, deletedAt: null, status: LeadStatus.ACTIVE },
    });

    return [
      ...stageResults,
      { stage: null, count: noStageCount },
    ];
  }

  // ─── BY SOURCE ──────────────────────────────────────────────────────────────

  async bySource(actor: AuthenticatedUser) {
    const tenantId = actor.tenantId;

    const groups = await this.prisma.lead.groupBy({
      by: ['source'],
      where: { tenantId, deletedAt: null },
      _count: { source: true },
      orderBy: { _count: { source: 'desc' } },
    });

    const total = groups.reduce((s, g) => s + g._count.source, 0);

    return groups
      .filter((g) => g._count.source > 0)
      .map((g) => ({
        source:     g.source,
        count:      g._count.source,
        percentage: total > 0 ? round1((g._count.source / total) * 100) : 0,
      }));
  }

  // ─── BY SELLER ──────────────────────────────────────────────────────────────

  async bySeller(actor: AuthenticatedUser, dto: ReportsQueryDto) {
    const tenantId = actor.tenantId;
    const { start, end } = defaultRange(dto);

    const users = await this.prisma.user.findMany({
      where: { tenantId, isActive: true, role: { not: Role.ADMIN } },
      select: { id: true, name: true, avatarUrl: true },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(
      users.map(async (user) => {
        const baseLeadWhere = { tenantId, assignedToId: user.id, deletedAt: null as null };

        const [assigned, active, won, lost, actGroups, wonForTime] = await Promise.all([
          this.prisma.lead.count({ where: baseLeadWhere }),
          this.prisma.lead.count({ where: { ...baseLeadWhere, status: LeadStatus.ACTIVE } }),
          this.prisma.lead.count({ where: { ...baseLeadWhere, status: LeadStatus.WON } }),
          this.prisma.lead.count({ where: { ...baseLeadWhere, status: LeadStatus.LOST } }),
          this.prisma.activity.groupBy({
            by: ['type'],
            where: { tenantId, userId: user.id, createdAt: { gte: start, lte: end } },
            _count: { type: true },
          }),
          this.prisma.lead.findMany({
            where: { ...baseLeadWhere, status: LeadStatus.WON },
            select: { createdAt: true, updatedAt: true },
          }),
          this.prisma.lead.aggregate({
            where: { ...baseLeadWhere, status: LeadStatus.WON },
            _sum: { budget: true },
          }),
        ]);

        const revenueAgg = await this.prisma.lead.aggregate({
          where: { ...baseLeadWhere, status: LeadStatus.WON },
          _sum: { budget: true },
        });

        const actMap: Partial<Record<ActivityType, number>> = {};
        for (const g of actGroups) actMap[g.type] = g._count.type;

        let avgTimeToClose = 0;
        if (wonForTime.length > 0) {
          const totalDays = wonForTime.reduce(
            (s, l) => s + msTodays(l.updatedAt.getTime() - l.createdAt.getTime()),
            0,
          );
          avgTimeToClose = Math.round(totalDays / wonForTime.length);
        }

        return {
          userId:    user.id,
          name:      user.name,
          avatarUrl: user.avatarUrl,
          leads: { assigned, active, won, lost },
          activities: {
            total:    actGroups.reduce((s, g) => s + g._count.type, 0),
            calls:    actMap[ActivityType.CALL]    ?? 0,
            meetings: actMap[ActivityType.MEETING] ?? 0,
          },
          conversionRate: assigned > 0 ? round1((won / assigned) * 100) : 0,
          avgTimeToClose,
          revenue: Number(revenueAgg._sum.budget ?? 0),
        };
      }),
    );

    return results;
  }

  // ─── PROJECTED REVENUE ──────────────────────────────────────────────────────

  async projectedRevenue(actor: AuthenticatedUser) {
    const tenantId = actor.tenantId;

    const stages = await this.prisma.pipelineStage.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, color: true, probability: true },
    });

    const results = await Promise.all(
      stages.map(async (stage) => {
        const agg = await this.prisma.lead.aggregate({
          where: { tenantId, stageId: stage.id, deletedAt: null, status: LeadStatus.ACTIVE },
          _sum: { budget: true },
          _count: { id: true },
        });
        const pipeline = Number(agg._sum.budget ?? 0);
        const projected = pipeline * (stage.probability / 100);
        return {
          stageId:     stage.id,
          stageName:   stage.name,
          color:       stage.color,
          probability: stage.probability,
          leadCount:   agg._count.id,
          pipeline:    round1(pipeline),
          projected:   round1(projected),
        };
      }),
    );

    const totalPipeline  = results.reduce((s, r) => s + r.pipeline, 0);
    const totalProjected = results.reduce((s, r) => s + r.projected, 0);

    return { stages: results, totalPipeline, totalProjected };
  }

  // ─── LOST BY REASON ─────────────────────────────────────────────────────────

  async lostByReason(actor: AuthenticatedUser) {
    const tenantId = actor.tenantId;

    // Group by lossReasonId
    const groups = await this.prisma.lead.groupBy({
      by: ['lossReasonId'],
      where: { tenantId, status: LeadStatus.LOST, deletedAt: null },
      _count: { id: true },
    });

    const total = groups.reduce((s, g) => s + g._count.id, 0);

    // Resolve reason names
    const reasonIds = groups
      .map((g) => g.lossReasonId)
      .filter((id): id is string => !!id);

    const reasons = await this.prisma.lossReason.findMany({
      where: { id: { in: reasonIds } },
      select: { id: true, name: true },
    });

    const reasonMap = new Map(reasons.map((r) => [r.id, r.name]));

    return groups.map((g) => ({
      lossReasonId:   g.lossReasonId ?? null,
      lossReasonName: g.lossReasonId ? (reasonMap.get(g.lossReasonId) ?? 'Desconocido') : 'Sin motivo',
      count:          g._count.id,
      percentage:     total > 0 ? round1((g._count.id / total) * 100) : 0,
    }));
  }

  // ─── PIPELINE VELOCITY ──────────────────────────────────────────────────────

  async velocity(actor: AuthenticatedUser) {
    const tenantId = actor.tenantId;

    const stages = await this.prisma.pipelineStage.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, color: true },
    });

    const results = await Promise.all(
      stages.map(async (stage) => {
        const histories = await this.prisma.leadStageHistory.findMany({
          where: { stageId: stage.id, daysInStage: { not: null } },
          select: { daysInStage: true },
        });

        const avgDays =
          histories.length > 0
            ? round1(
                histories.reduce((s, h) => s + (h.daysInStage ?? 0), 0) / histories.length,
              )
            : 0;

        return {
          stageId:   stage.id,
          stageName: stage.name,
          color:     stage.color,
          avgDays,
          sampleSize: histories.length,
        };
      }),
    );

    return results;
  }

  // ─── TIMELINE ───────────────────────────────────────────────────────────────

  async timeline(actor: AuthenticatedUser, dto: TimelineQueryDto) {
    const tenantId = actor.tenantId;
    const { start, end } = defaultRange(dto);
    const groupBy = dto.groupBy ?? 'day';

    const leads = await this.prisma.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: start, lte: end },
      },
      select: { createdAt: true, status: true },
    });

    // Build date-keyed map
    const map = new Map<string, { count: number; won: number; lost: number }>();

    const getKey = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');

      if (groupBy === 'month') return `${y}-${m}`;
      if (groupBy === 'week') {
        // ISO week start (Monday)
        const day = date.getDay() || 7; // Sunday = 7
        const monday = new Date(date);
        monday.setDate(date.getDate() - day + 1);
        const wy = monday.getFullYear();
        const wm = String(monday.getMonth() + 1).padStart(2, '0');
        const wd = String(monday.getDate()).padStart(2, '0');
        return `${wy}-${wm}-${wd}`;
      }
      return `${y}-${m}-${d}`;
    };

    for (const lead of leads) {
      const key = getKey(lead.createdAt);
      const entry = map.get(key) ?? { count: 0, won: 0, lost: 0 };
      entry.count++;
      if (lead.status === LeadStatus.WON)  entry.won++;
      if (lead.status === LeadStatus.LOST) entry.lost++;
      map.set(key, entry);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));
  }
}
