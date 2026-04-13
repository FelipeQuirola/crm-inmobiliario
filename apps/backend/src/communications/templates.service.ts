import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ListTemplatesDto } from './dto/list-templates.dto';
import { resolveTemplate } from './helpers/resolve-template.helper';

const TEMPLATE_SELECT = {
  id:        true,
  name:      true,
  type:      true,
  subject:   true,
  body:      true,
  isActive:  true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.TemplateSelect;

const LEAD_RESOLVE_SELECT = {
  firstName:        true,
  lastName:         true,
  phone:            true,
  email:            true,
  propertyInterest: true,
  budget:           true,
  assignedTo:       { select: { name: true } },
} satisfies Prisma.LeadSelect;

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── LIST ──────────────────────────────────────────────────────────────────

  async list(actor: AuthenticatedUser, dto: ListTemplatesDto) {
    const where: Prisma.TemplateWhereInput = {
      tenantId: actor.tenantId,
      ...(dto.type && { type: dto.type }),
      ...(!dto.includeInactive && { isActive: true }),
    };

    return this.prisma.template.findMany({
      where,
      select: TEMPLATE_SELECT,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async create(actor: AuthenticatedUser, dto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        name:        dto.name,
        type:        dto.type,
        subject:     dto.subject,
        body:        dto.body,
        tenantId:    actor.tenantId,
        createdById: actor.id,
      },
      select: TEMPLATE_SELECT,
    });
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  async update(actor: AuthenticatedUser, id: string, dto: UpdateTemplateDto) {
    await this.assertExists(actor, id);

    return this.prisma.template.update({
      where: { id },
      data: {
        ...(dto.name    !== undefined && { name:    dto.name }),
        ...(dto.type    !== undefined && { type:    dto.type }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.body    !== undefined && { body:    dto.body }),
      },
      select: TEMPLATE_SELECT,
    });
  }

  // ─── DEACTIVATE ────────────────────────────────────────────────────────────

  async deactivate(actor: AuthenticatedUser, id: string) {
    await this.assertExists(actor, id);
    return this.prisma.template.update({
      where: { id },
      data: { isActive: false },
      select: TEMPLATE_SELECT,
    });
  }

  // ─── PREVIEW ───────────────────────────────────────────────────────────────

  async preview(actor: AuthenticatedUser, id: string, leadId?: string) {
    const template = await this.assertExists(actor, id);

    if (!leadId) {
      return { ...template, resolvedBody: template.body, resolvedSubject: template.subject };
    }

    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId: actor.tenantId, deletedAt: null },
      select: LEAD_RESOLVE_SELECT,
    });

    if (!lead) throw new NotFoundException('Lead no encontrado');

    const resolvedBody    = resolveTemplate(template.body, lead);
    const resolvedSubject = template.subject ? resolveTemplate(template.subject, lead) : null;

    return { ...template, resolvedBody, resolvedSubject };
  }

  // ─── PRIVATE ───────────────────────────────────────────────────────────────

  private async assertExists(actor: AuthenticatedUser, id: string) {
    const template = await this.prisma.template.findFirst({
      where: { id, tenantId: actor.tenantId },
      select: TEMPLATE_SELECT,
    });
    if (!template) throw new NotFoundException('Plantilla no encontrada');
    return template;
  }
}
