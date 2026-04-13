import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, ActivityType, LeadStatus, LeadSource, Role } from '@prisma/client';
import * as XLSX from 'xlsx';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { normalizePhone, computeDuplicateHash } from './helpers/lead.helpers';
import { ScoringService } from '@/scoring/scoring.service';

// Selección reutilizable para respuestas de lead
const LEAD_INCLUDE = {
  stage: { select: { id: true, name: true, color: true, order: true } },
  assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
  score: { select: { score: true, temperature: true, urgency: true } },
} satisfies Prisma.LeadInclude;

// Selección de lead con actividades recientes (para el detalle)
const LEAD_INCLUDE_DETAIL = {
  stage: { select: { id: true, name: true, color: true, order: true } },
  assignedTo: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
  score: { select: { score: true, temperature: true, urgency: true } },
  activities: {
    orderBy: { createdAt: 'desc' as const },
    take: 5,
    select: {
      id: true,
      type: true,
      description: true,
      metadata: true,
      createdAt: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
} satisfies Prisma.LeadInclude;

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async create(dto: CreateLeadDto, actor: AuthenticatedUser) {
    const phoneNormalized = normalizePhone(dto.phone);
    const duplicateHash = computeDuplicateHash(phoneNormalized, dto.email);

    // Detección de duplicado dentro del tenant
    const duplicate = await this.prisma.lead.findFirst({
      where: { tenantId: actor.tenantId, duplicateHash, deletedAt: null },
      include: LEAD_INCLUDE,
    });

    if (duplicate) {
      throw new ConflictException({
        message: 'Ya existe un lead con el mismo teléfono y email en este tenant.',
        lead: duplicate,
      });
    }

    // Resolver asignación según rol
    const assignedToId = await this.resolveAssignee(
      dto.assignedToId,
      actor,
    );

    // Validar stageId si se envía
    if (dto.stageId) {
      await this.assertStageExists(dto.stageId, actor.tenantId);
    }

    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email?.toLowerCase() ?? null,
          phone: dto.phone,
          phoneNormalized,
          duplicateHash,
          source: dto.source ?? LeadSource.MANUAL,
          notes: dto.notes ?? null,
          propertyInterest: dto.propertyInterest ?? null,
          budget: dto.budget ?? null,
          nextActionAt: dto.nextActionAt ? new Date(dto.nextActionAt) : null,
          assignedToId: assignedToId ?? null,
          stageId: dto.stageId ?? null,
          tenantId: actor.tenantId,
        },
        include: LEAD_INCLUDE,
      });

      await tx.activity.create({
        data: {
          type: ActivityType.LEAD_CREATED,
          description: `Lead creado por ${actor.name}`,
          metadata: { source: dto.source ?? LeadSource.MANUAL },
          leadId: lead.id,
          userId: actor.id,
          tenantId: actor.tenantId,
        },
      });

      // Fire-and-forget score calculation
      void this.scoring.calculateScore(lead.id, actor.tenantId);

      return lead;
    });
  }

  // -------------------------------------------------------------------------
  // LIST (cursor-based)
  // -------------------------------------------------------------------------

  async findAll(query: ListLeadsDto, actor: AuthenticatedUser) {
    const limit = query.limit ?? 20;

    const where: Prisma.LeadWhereInput = {
      tenantId: actor.tenantId,
      deletedAt: null,
      ...(query.status !== undefined && { status: query.status }),
      ...(query.stageId !== undefined && { stageId: query.stageId }),
      ...(query.source !== undefined && { source: query.source }),
      // VENDEDOR solo ve sus leads; ADMIN puede filtrar por vendedor
      ...(actor.role === Role.VENDEDOR
        ? { assignedToId: actor.id }
        : query.assignedToId !== undefined
          ? { assignedToId: query.assignedToId }
          : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              {
                phoneNormalized: {
                  contains: normalizePhone(query.search),
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        take: limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
        include: LEAD_INCLUDE,
      }),
      this.prisma.lead.count({ where }),
    ]);

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const next = items.pop()!;
      nextCursor = next.id;
    }

    return { data: items, total, nextCursor };
  }

  // -------------------------------------------------------------------------
  // FIND ONE
  // -------------------------------------------------------------------------

  async findOne(id: string, actor: AuthenticatedUser) {
    const lead = await this.prisma.lead.findFirst({
      where: this.buildScopeWhere(id, actor),
      include: LEAD_INCLUDE_DETAIL,
    });

    if (!lead) throw new NotFoundException('Lead no encontrado');
    return lead;
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async update(id: string, dto: UpdateLeadDto, actor: AuthenticatedUser) {
    const existing = await this.prisma.lead.findFirst({
      where: this.buildScopeWhere(id, actor),
    });
    if (!existing) throw new NotFoundException('Lead no encontrado');

    const pendingActivities: Prisma.ActivityCreateManyInput[] = [];

    // Detectar cambio de etapa
    if (dto.stageId !== undefined && dto.stageId !== existing.stageId) {
      if (dto.stageId !== null) {
        await this.assertStageExists(dto.stageId, actor.tenantId);
      }
      pendingActivities.push({
        type: ActivityType.STAGE_CHANGED,
        description: 'Etapa del pipeline actualizada',
        metadata: {
          previousStageId: existing.stageId,
          newStageId: dto.stageId,
        },
        leadId: id,
        userId: actor.id,
        tenantId: actor.tenantId,
      });
    }

    // Detectar reasignación
    if (
      dto.assignedToId !== undefined &&
      dto.assignedToId !== existing.assignedToId
    ) {
      if (dto.assignedToId !== null) {
        await this.assertUserInTenant(dto.assignedToId, actor.tenantId);
      }
      pendingActivities.push({
        type: ActivityType.REASSIGNED,
        description:
          dto.assignedToId === null
            ? 'Lead desasignado'
            : `Lead reasignado`,
        metadata: {
          previousAssigneeId: existing.assignedToId,
          newAssigneeId: dto.assignedToId,
        },
        leadId: id,
        userId: actor.id,
        tenantId: actor.tenantId,
      });
    }

    // Recalcular hash si cambia teléfono o email
    const newPhone = dto.phone ?? existing.phone;
    const newEmail =
      dto.email !== undefined ? dto.email : existing.email;

    const phoneNormalized =
      dto.phone !== undefined
        ? normalizePhone(newPhone)
        : existing.phoneNormalized;

    const duplicateHash =
      dto.phone !== undefined || dto.email !== undefined
        ? computeDuplicateHash(phoneNormalized, newEmail)
        : existing.duplicateHash;

    // Verificar que el nuevo hash no choque con otro lead
    if (duplicateHash !== existing.duplicateHash) {
      const collision = await this.prisma.lead.findFirst({
        where: {
          tenantId: actor.tenantId,
          duplicateHash,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (collision) {
        throw new ConflictException({
          message: 'Los nuevos datos coinciden con un lead existente.',
          lead: collision,
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.phone !== undefined && { phone: dto.phone, phoneNormalized }),
          ...(dto.email !== undefined && {
            email: dto.email?.toLowerCase() ?? null,
          }),
          ...(dto.phone !== undefined || dto.email !== undefined
            ? { duplicateHash }
            : {}),
          ...(dto.source !== undefined && { source: dto.source }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.propertyInterest !== undefined && {
            propertyInterest: dto.propertyInterest,
          }),
          ...(dto.budget !== undefined && { budget: dto.budget }),
          ...(dto.nextActionAt !== undefined && {
            nextActionAt: dto.nextActionAt
              ? new Date(dto.nextActionAt)
              : null,
          }),
          ...(dto.stageId !== undefined && { stageId: dto.stageId }),
          ...(dto.assignedToId !== undefined && {
            assignedToId: dto.assignedToId,
          }),
        },
        include: LEAD_INCLUDE,
      });

      if (pendingActivities.length > 0) {
        await tx.activity.createMany({ data: pendingActivities });
      }

      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // CHANGE STATUS
  // -------------------------------------------------------------------------

  async changeStatus(
    id: string,
    dto: ChangeStatusDto,
    actor: AuthenticatedUser,
  ) {
    if (dto.status === LeadStatus.LOST && !dto.lossReasonId && !dto.lostReason) {
      throw new BadRequestException(
        'lossReasonId es obligatorio cuando el status es LOST',
      );
    }

    // Validate lossReasonId belongs to tenant
    let lossReasonName: string | null = null;
    if (dto.lossReasonId) {
      const reason = await this.prisma.lossReason.findFirst({
        where: { id: dto.lossReasonId, tenantId: actor.tenantId },
      });
      if (!reason) throw new BadRequestException('Motivo de pérdida no válido');
      lossReasonName = reason.name;
    }

    const existing = await this.prisma.lead.findFirst({
      where: this.buildScopeWhere(id, actor),
    });
    if (!existing) throw new NotFoundException('Lead no encontrado');

    if (existing.status === dto.status) {
      throw new BadRequestException(
        `El lead ya tiene el status ${dto.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          status: dto.status,
          ...(dto.status === LeadStatus.LOST
            ? {
                lostReason: dto.lostReason ?? lossReasonName ?? null,
                lossReasonId: dto.lossReasonId ?? null,
              }
            : { lostReason: null, lossReasonId: null }),
        },
        include: {
          ...LEAD_INCLUDE,
          lossReason: { select: { id: true, name: true } },
        },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.STATUS_CHANGED,
          description: `Status cambiado de ${existing.status} a ${dto.status}${lossReasonName ? `: ${lossReasonName}` : dto.lostReason ? `: ${dto.lostReason}` : ''}`,
          metadata: {
            previousStatus: existing.status,
            newStatus: dto.status,
            ...(lossReasonName ? { lossReason: lossReasonName } : {}),
            ...(dto.lossReasonId ? { lossReasonId: dto.lossReasonId } : {}),
          },
          leadId: id,
          userId: actor.id,
          tenantId: actor.tenantId,
        },
      });

      // Fire-and-forget: save feedback + recalculate score on terminal statuses
      if (dto.status === LeadStatus.WON || dto.status === LeadStatus.LOST) {
        void this.scoring.saveFeedback(
          id,
          actor.tenantId,
          dto.status as 'WON' | 'LOST',
          dto.status === LeadStatus.LOST ? (dto.lossReasonId ?? null) : null,
        );
      }
      void this.scoring.calculateScore(id, actor.tenantId);

      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // ASSIGN
  // -------------------------------------------------------------------------

  async assign(
    id: string,
    assignedToId: string | null,
    actor: AuthenticatedUser,
  ) {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden reasignar leads');
    }

    const existing = await this.prisma.lead.findFirst({
      where: { id, tenantId: actor.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Lead no encontrado');

    if (assignedToId !== null) {
      await this.assertUserInTenant(assignedToId, actor.tenantId);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: { assignedToId },
        include: LEAD_INCLUDE,
      });

      await tx.activity.create({
        data: {
          type: ActivityType.REASSIGNED,
          description:
            assignedToId === null
              ? 'Lead desasignado'
              : `Lead reasignado`,
          metadata: {
            previousAssigneeId: existing.assignedToId,
            newAssigneeId: assignedToId,
          },
          leadId: id,
          userId: actor.id,
          tenantId: actor.tenantId,
        },
      });

      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // IMPORT FROM EXCEL (solo ADMIN)
  // -------------------------------------------------------------------------

  async importFromExcel(
    fileBuffer: Buffer,
    actor: AuthenticatedUser,
  ): Promise<{
    total: number;
    created: number;
    skipped: number;
    errors: number;
    errorDetails: { row: number; reason: string }[];
  }> {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden importar leads');
    }

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    if (rows.length > 500) {
      throw new BadRequestException(
        'El archivo excede el límite de 500 filas. Divida el archivo en partes más pequeñas.',
      );
    }

    // Column name aliases (case-insensitive)
    const COL_MAP: Record<string, string> = {
      nombre: 'firstName', 'first name': 'firstName', firstname: 'firstName',
      apellido: 'lastName', 'last name': 'lastName', lastname: 'lastName',
      teléfono: 'phone', telefono: 'phone', phone: 'phone', celular: 'phone',
      email: 'email', correo: 'email',
      presupuesto: 'budget', budget: 'budget', precio: 'budget',
      interés: 'propertyInterest', interes: 'propertyInterest',
      propiedad: 'propertyInterest', property: 'propertyInterest',
      'interés en propiedad': 'propertyInterest',
      notas: 'notes', notes: 'notes', observaciones: 'notes',
      origen: 'source', source: 'source',
    };

    const SOURCE_MAP: Record<string, LeadSource> = {
      MANUAL: LeadSource.MANUAL,
      WEBSITE: LeadSource.WEBSITE,
      REFERRAL: LeadSource.REFERRAL,
      FACEBOOK: LeadSource.FACEBOOK,
      WHATSAPP: LeadSource.WHATSAPP,
      GOOGLE: LeadSource.GOOGLE,
      OTHER: LeadSource.OTHER,
    };

    // Round-robin assignee list
    const activeUsers = await this.prisma.user.findMany({
      where: { tenantId: actor.tenantId, isActive: true, role: Role.VENDEDOR },
      select: { id: true },
      orderBy: { name: 'asc' },
    });
    let rrIndex = 0;

    let created = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // 1-based, +1 for header
      const raw = rows[i];

      // Normalize column names
      const normalized: Record<string, string> = {};
      for (const [k, v] of Object.entries(raw)) {
        const mapped = COL_MAP[k.toLowerCase().trim()];
        if (mapped) normalized[mapped] = String(v).trim();
      }

      // Validate required fields
      if (!normalized.firstName) {
        errors++;
        errorDetails.push({ row: rowNum, reason: 'Nombre requerido' });
        continue;
      }
      if (!normalized.phone || normalized.phone.replace(/\D/g, '').length < 7) {
        errors++;
        errorDetails.push({ row: rowNum, reason: 'Teléfono inválido o faltante' });
        continue;
      }

      const phoneNormalized = normalizePhone(normalized.phone);
      const email = normalized.email?.toLowerCase() || undefined;
      const duplicateHash = computeDuplicateHash(phoneNormalized, email);

      // Check duplicate
      const existing = await this.prisma.lead.findFirst({
        where: { tenantId: actor.tenantId, duplicateHash, deletedAt: null },
      });
      if (existing) {
        skipped++;
        continue;
      }

      // Round-robin assignment
      const assignedToId = activeUsers.length > 0
        ? activeUsers[rrIndex % activeUsers.length].id
        : undefined;
      rrIndex++;

      // Map source
      const sourceRaw = normalized.source?.toUpperCase().trim();
      const source: LeadSource = (sourceRaw && SOURCE_MAP[sourceRaw]) ? SOURCE_MAP[sourceRaw] : LeadSource.MANUAL;

      // Parse budget
      const budget = normalized.budget
        ? parseFloat(normalized.budget.replace(/[^\d.]/g, '')) || undefined
        : undefined;

      try {
        await this.prisma.$transaction(async (tx) => {
          const lead = await tx.lead.create({
            data: {
              firstName: normalized.firstName,
              lastName: normalized.lastName ?? '',
              email: email ?? null,
              phone: normalized.phone,
              phoneNormalized,
              duplicateHash,
              source,
              notes: normalized.notes ?? null,
              propertyInterest: normalized.propertyInterest ?? null,
              budget: budget ?? null,
              assignedToId: assignedToId ?? null,
              tenantId: actor.tenantId,
            },
          });

          await tx.activity.create({
            data: {
              type: ActivityType.LEAD_CREATED,
              description: `Lead importado desde Excel por ${actor.name}`,
              metadata: { source, importedAt: new Date().toISOString() },
              leadId: lead.id,
              userId: actor.id,
              tenantId: actor.tenantId,
            },
          });

          void this.scoring.calculateScore(lead.id, actor.tenantId);
        });
        created++;
      } catch {
        errors++;
        errorDetails.push({ row: rowNum, reason: 'Error al crear el lead' });
      }
    }

    return { total: rows.length, created, skipped, errors, errorDetails };
  }

  // -------------------------------------------------------------------------
  // SOFT DELETE (solo ADMIN)
  // -------------------------------------------------------------------------

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar leads');
    }

    const existing = await this.prisma.lead.findFirst({
      where: { id, tenantId: actor.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Lead no encontrado');

    await this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // -------------------------------------------------------------------------
  // HELPERS PRIVADOS
  // -------------------------------------------------------------------------

  /**
   * Filtra leads por tenant y, si el actor es VENDEDOR, por su propia asignación.
   */
  private buildScopeWhere(
    id: string,
    actor: AuthenticatedUser,
  ): Prisma.LeadWhereInput {
    return {
      id,
      tenantId: actor.tenantId,
      deletedAt: null,
      ...(actor.role === Role.VENDEDOR ? { assignedToId: actor.id } : {}),
    };
  }

  private async resolveAssignee(
    requestedId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<string | undefined> {
    if (actor.role === Role.VENDEDOR) {
      return actor.id;
    }
    if (requestedId) {
      await this.assertUserInTenant(requestedId, actor.tenantId);
      return requestedId;
    }
    return undefined;
  }

  private async assertStageExists(
    stageId: string,
    tenantId: string,
  ): Promise<void> {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, tenantId },
    });
    if (!stage) {
      throw new BadRequestException(
        `La etapa '${stageId}' no existe en este tenant`,
      );
    }
  }

  private async assertUserInTenant(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, isActive: true },
    });
    if (!user) {
      throw new BadRequestException(
        `El usuario '${userId}' no existe o está inactivo en este tenant`,
      );
    }
  }
}
