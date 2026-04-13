import { Injectable, Logger } from '@nestjs/common';
import { LeadSource, LeadStatus, LeadTemperature } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { GeminiService } from './gemini.service';

// ─── Source score table ───────────────────────────────────────────────────────

const SOURCE_SCORE: Record<LeadSource, number> = {
  REFERRAL: 15,
  WEBSITE:  12,
  WHATSAPP: 10,
  FACEBOOK:  8,
  GOOGLE:    8,
  MANUAL:    6,
  OTHER:     5,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function msToHours(ms: number): number {
  return ms / (1000 * 60 * 60);
}

function toTemperature(score: number): LeadTemperature {
  if (score >= 70) return LeadTemperature.HOT;
  if (score >= 40) return LeadTemperature.WARM;
  return LeadTemperature.COLD;
}

interface GeminiResult {
  bonusScore: number;
  signals: { positive: string[]; negative: string[] };
  reasoning: string;
  recommendation: string;
  urgency: string;
}

function parseGeminiJson(raw: string): GeminiResult | null {
  // Strip markdown fences if present
  const stripped = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(stripped) as GeminiResult;
  } catch {
    // Regex rescue — try to extract the JSON object
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as GeminiResult;
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  // ─── MAIN: calculate & persist score ─────────────────────────────────────

  async calculateScore(leadId: string, tenantId: string): Promise<void> {
    try {
      await this._doCalculate(leadId, tenantId);
    } catch (err) {
      this.logger.error(`Score calculation failed for lead ${leadId}`, (err as Error).message);
    }
  }

  private async _doCalculate(leadId: string, tenantId: string): Promise<void> {
    // ── Step 1: gather lead data ──────────────────────────────────────────────
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId, deletedAt: null },
      include: {
        stage: { select: { id: true, name: true, order: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { type: true, description: true, createdAt: true },
        },
        interestedProperties: { select: { id: true } },
        stageHistory: { select: { id: true } },
        checklistProgress: { select: { isDone: true } },
      },
    });

    if (!lead) return;

    const now = new Date();
    const daysSinceCreated = (now.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Last activity
    const lastActivity = lead.activities[0] ?? null;
    const hoursSinceLastActivity = lastActivity
      ? msToHours(now.getTime() - new Date(lastActivity.createdAt).getTime())
      : Infinity;

    // ── Step 2: base score (0–60) ─────────────────────────────────────────────
    let baseScore = 0;
    const factors: Record<string, number> = {};

    // Source
    const sourcePoints = SOURCE_SCORE[lead.source] ?? 5;
    factors.source = sourcePoints;
    baseScore += sourcePoints;

    // Budget
    if (lead.budget !== null) {
      factors.budget = 10;
      baseScore += 10;
    }

    // Profile completeness
    if (lead.email) { factors.email = 5; baseScore += 5; }
    if (lead.propertyInterest) { factors.propertyInterest = 5; baseScore += 5; }
    if (lead.interestedProperties.length > 0) { factors.linkedProperties = 5; baseScore += 5; }

    // Recent activity
    let activityPoints = 0;
    if (hoursSinceLastActivity < 24)       activityPoints = 10;
    else if (hoursSinceLastActivity < 72)  activityPoints = 7;
    else if (hoursSinceLastActivity < 168) activityPoints = 4;
    factors.recentActivity = activityPoints;
    baseScore += activityPoints;

    // Stage progress (order-based)
    let stagePoints = 0;
    if (lead.stage) {
      if (lead.stage.order === 1) stagePoints = 0;
      else if (lead.stage.order === 2) stagePoints = 5;
      else if (lead.stage.order === 3) stagePoints = 10;
      else stagePoints = 15;
    }
    factors.stageProgress = stagePoints;
    baseScore += stagePoints;

    // Checklist completion
    const totalItems = lead.checklistProgress.length;
    const doneItems  = lead.checklistProgress.filter((p) => p.isDone).length;
    let checklistPoints = 0;
    if (totalItems > 0) {
      const pct = doneItems / totalItems;
      if (pct >= 1.0)  checklistPoints = 5;
      else if (pct >= 0.5) checklistPoints = 3;
    }
    factors.checklist = checklistPoints;
    baseScore += checklistPoints;

    // Cap at 60
    baseScore = Math.min(baseScore, 60);

    // ── Step 3: Gemini bonus (0–40) ───────────────────────────────────────────
    let geminiBonus     = 0;
    let reasoning       = this._generateReasoning(lead.source, !!lead.budget, activityPoints, stagePoints);
    let recommendation  = 'Continuar con el seguimiento del lead.';
    let urgency         = 'MEDIA';
    let positiveSignals: string[] = [];
    let negativeSignals: string[] = [];
    let geminiAnalysis  = '';

    if (this.gemini.isEnabled) {
      const feedbackContext = await this._buildFeedbackContext(tenantId);
      const prompt = this._buildPrompt(lead, daysSinceCreated, hoursSinceLastActivity, feedbackContext);

      const rawResponse = await this.gemini.analyzeLead(prompt);

      if (rawResponse) {
        geminiAnalysis = rawResponse;
        const parsed = parseGeminiJson(rawResponse);
        if (parsed) {
          geminiBonus     = Math.max(0, Math.min(40, parsed.bonusScore ?? 0));
          reasoning       = parsed.reasoning       ?? reasoning;
          recommendation  = parsed.recommendation  ?? recommendation;
          urgency         = parsed.urgency          ?? urgency;
          positiveSignals = parsed.signals?.positive ?? [];
          negativeSignals = parsed.signals?.negative ?? [];
        } else {
          geminiAnalysis = 'ERROR - JSON inválido, usando score base';
          this.logger.warn(`Gemini returned invalid JSON for lead ${leadId}`);
        }
      } else {
        geminiAnalysis = 'ERROR - usando score base';
      }
    } else {
      // Build basic signals without Gemini
      if (lead.budget) positiveSignals.push('Presupuesto definido');
      if (lead.email)  positiveSignals.push('Email registrado');
      if (activityPoints >= 7) positiveSignals.push('Actividad reciente alta');
      if (stagePoints >= 10)   positiveSignals.push('Avanzado en el embudo');
      if (!lead.email)         negativeSignals.push('Sin email registrado');
      if (!lead.budget)        negativeSignals.push('Sin presupuesto definido');
      if (activityPoints === 0) negativeSignals.push('Sin actividad reciente');
    }

    // ── Step 4: final score ───────────────────────────────────────────────────
    const finalScore = Math.min(100, baseScore + geminiBonus);
    const temperature = toTemperature(finalScore);

    // ── Step 5: persist ───────────────────────────────────────────────────────
    await this.prisma.leadScore.upsert({
      where: { leadId },
      create: {
        leadId,
        tenantId,
        score:            finalScore,
        temperature,
        factors,
        reasoning,
        recommendation,
        urgency,
        positiveSignals,
        negativeSignals,
        geminiAnalysis:   geminiAnalysis || null,
        lastCalculatedAt: now,
      },
      update: {
        score:            finalScore,
        temperature,
        factors,
        reasoning,
        recommendation,
        urgency,
        positiveSignals,
        negativeSignals,
        geminiAnalysis:   geminiAnalysis || null,
        lastCalculatedAt: now,
      },
    });
  }

  // ─── Feedback context ─────────────────────────────────────────────────────

  private async _buildFeedbackContext(tenantId: string): Promise<string> {
    const feedbacks = await this.prisma.scoringFeedback.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        finalStatus: true,
        scoreAtClose: true,
        factors: true,
        lossReason: { select: { name: true } },
      },
    });

    if (feedbacks.length === 0) {
      return 'No hay historial de conversiones aún para este tenant.';
    }

    const won  = feedbacks.filter((f) => f.finalStatus === LeadStatus.WON);
    const lost = feedbacks.filter((f) => f.finalStatus === LeadStatus.LOST);

    const avgWonScore  = won.length  > 0 ? Math.round(won.reduce((s, f)  => s + f.scoreAtClose, 0) / won.length)  : 0;
    const avgLostScore = lost.length > 0 ? Math.round(lost.reduce((s, f) => s + f.scoreAtClose, 0) / lost.length) : 0;

    // Source distribution in WON
    const sourceCounts: Record<string, number> = {};
    for (const f of won) {
      const factors = f.factors as Record<string, unknown>;
      const src = String(factors.source ?? 'UNKNOWN');
      sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
    }
    const topSources = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([s, c]) => `${s}(${c})`)
      .join(', ');

    return `Historial: ${won.length} ganados (score prom ${avgWonScore}), ${lost.length} perdidos (score prom ${avgLostScore}). Mejores fuentes en ganados: ${topSources || 'sin datos'}.`;
  }

  // ─── Prompt builder ───────────────────────────────────────────────────────

  private _buildPrompt(
    lead: {
      firstName: string;
      lastName: string;
      source: LeadSource;
      budget: unknown;
      propertyInterest: string | null;
      notes: string | null;
      stage: { name: string } | null;
      activities: { type: string; description: string; createdAt: Date }[];
    },
    daysSinceCreated: number,
    hoursSinceLastActivity: number,
    feedbackContext: string,
  ): string {
    const diasSinContacto = isFinite(hoursSinceLastActivity)
      ? `${Math.round(hoursSinceLastActivity / 24)} días`
      : 'nunca contactado';

    const actividadesStr = lead.activities
      .map((a) => `- [${a.type}] ${a.description}`)
      .join('\n') || 'Sin actividades registradas';

    return `Eres un experto en ventas inmobiliarias en Ecuador. Analiza este lead y evalúa su potencial de compra.

DATOS DEL LEAD:
Nombre: ${lead.firstName} ${lead.lastName}
Origen: ${lead.source}
Presupuesto: ${lead.budget ? `${lead.budget} USD` : 'No definido'}
Interés: ${lead.propertyInterest ?? 'No especificado'}
Notas iniciales: ${lead.notes ?? 'Sin notas'}
Días en el CRM: ${Math.round(daysSinceCreated)}
Actividades registradas: ${lead.activities.length}
Etapa actual: ${lead.stage?.name ?? 'Sin etapa'}
Última interacción: hace ${diasSinContacto}

HISTORIAL DE INTERACCIONES:
${actividadesStr}

CONTEXTO DE APRENDIZAJE:
${feedbackContext}

Responde ÚNICAMENTE con un JSON válido sin markdown:
{
  "bonusScore": 0,
  "signals": {
    "positive": ["señal positiva 1"],
    "negative": ["señal negativa 1"]
  },
  "reasoning": "explicación breve en español de máximo 2 oraciones",
  "recommendation": "acción concreta que debería tomar el vendedor ahora mismo",
  "urgency": "ALTA"
}

El campo urgency debe ser exactamente: ALTA, MEDIA o BAJA.
El bonusScore debe ser un número entero entre 0 y 40.`;
  }

  // ─── Fallback reasoning without Gemini ───────────────────────────────────

  private _generateReasoning(
    source: LeadSource,
    hasBudget: boolean,
    activityPoints: number,
    stagePoints: number,
  ): string {
    const parts: string[] = [];
    if (source === 'REFERRAL') parts.push('lead por referido (alta calidad)');
    if (hasBudget) parts.push('presupuesto definido');
    if (activityPoints >= 7) parts.push('actividad reciente');
    if (stagePoints >= 10) parts.push('avanzado en el embudo');
    if (parts.length === 0) parts.push('lead en etapa inicial sin señales fuertes');
    return `Score basado en: ${parts.join(', ')}.`;
  }

  // ─── Save ScoringFeedback (call when WON or LOST) ─────────────────────────

  async saveFeedback(
    leadId: string,
    tenantId: string,
    finalStatus: 'WON' | 'LOST',
    lossReasonId?: string | null,
  ): Promise<void> {
    try {
      const score = await this.prisma.leadScore.findUnique({
        where: { leadId },
        select: { score: true, factors: true },
      });

      await this.prisma.scoringFeedback.create({
        data: {
          leadId,
          tenantId,
          finalStatus,
          scoreAtClose: score?.score ?? 0,
          factors: (score?.factors ?? {}) as object,
          lossReasonId: lossReasonId ?? null,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to save scoring feedback for lead ${leadId}`, (err as Error).message);
    }
  }

  // ─── Get score (for controller) ───────────────────────────────────────────

  async getScore(leadId: string, tenantId: string) {
    return this.prisma.leadScore.findFirst({
      where: { leadId, tenantId },
    });
  }

  // ─── Insights (admin) ────────────────────────────────────────────────────

  async getInsights(tenantId: string, assignedToId?: string) {
    const activeLeadWhere = {
      deletedAt: null,
      status: { in: [LeadStatus.ACTIVE, LeadStatus.PAUSED] },
      ...(assignedToId ? { assignedToId } : {}),
    };

    const [distribution, topHot, feedbacks] = await Promise.all([
      this.prisma.leadScore.groupBy({
        by: ['temperature'],
        where: {
          tenantId,
          ...(assignedToId ? { lead: { assignedToId } } : {}),
        },
        _count: { temperature: true },
      }),
      this.prisma.leadScore.findMany({
        where: { tenantId, lead: activeLeadWhere },
        orderBy: { score: 'desc' },
        take: 5,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              stage: { select: { id: true, name: true, color: true } },
              assignedTo: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      }),
      // Feedback conversion rates are tenant-wide (not filtered by assignedTo)
      this.prisma.scoringFeedback.findMany({
        where: { tenantId },
        select: { finalStatus: true, scoreAtClose: true },
      }),
    ]);

    const dist: Record<string, number> = {};
    for (const d of distribution) dist[d.temperature] = d._count.temperature;

    // Conversion rate by temperature
    const wonFeedback  = feedbacks.filter((f) => f.finalStatus === 'WON');
    const lostFeedback = feedbacks.filter((f) => f.finalStatus === 'LOST');

    // Bucket historical feedbacks by temperature at close
    const buckets = { HOT: { won: 0, lost: 0 }, WARM: { won: 0, lost: 0 }, COLD: { won: 0, lost: 0 } };
    for (const f of feedbacks) {
      const temp = toTemperature(f.scoreAtClose);
      const bucket = buckets[temp];
      if (f.finalStatus === 'WON') bucket.won++;
      else bucket.lost++;
    }

    const conversionByTemperature = Object.entries(buckets).map(([temp, counts]) => {
      const total = counts.won + counts.lost;
      return { temperature: temp, conversionRate: total > 0 ? Math.round((counts.won / total) * 100) : null, total };
    });

    return {
      distribution: {
        HOT:  dist['HOT']  ?? 0,
        WARM: dist['WARM'] ?? 0,
        COLD: dist['COLD'] ?? 0,
      },
      topLeads: topHot.map((s) => ({
        leadId:      s.lead.id,
        firstName:   s.lead.firstName,
        lastName:    s.lead.lastName,
        score:       s.score,
        temperature: s.temperature,
        stage:       s.lead.stage,
        assignedTo:  s.lead.assignedTo,
      })),
      conversionByTemperature,
    };
  }

  // ─── Batch recalculate for active leads (used by cron) ───────────────────

  async recalculateAllActive(tenantId: string): Promise<void> {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId, status: LeadStatus.ACTIVE, deletedAt: null },
      select: { id: true },
    });

    // Process in batches of 10 with 1s delay to respect Gemini rate limits
    const batchSize = 10;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      for (const lead of batch) {
        await this.calculateScore(lead.id, tenantId);
        if (this.gemini.isEnabled) {
          await new Promise((r) => setTimeout(r, 1000)); // 1s delay per request
        }
      }
    }
  }
}
