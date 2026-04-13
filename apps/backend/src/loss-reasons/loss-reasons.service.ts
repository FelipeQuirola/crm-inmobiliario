import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import type { CreateLossReasonDto, UpdateLossReasonDto } from './dto/loss-reason.dto';

@Injectable()
export class LossReasonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(actor: AuthenticatedUser) {
    return this.prisma.lossReason.findMany({
      where: { tenantId: actor.tenantId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { leads: true } } },
    });
  }

  async create(dto: CreateLossReasonDto, actor: AuthenticatedUser) {
    return this.prisma.lossReason.create({
      data: {
        name: dto.name,
        tenantId: actor.tenantId,
      },
    });
  }

  async update(id: string, dto: UpdateLossReasonDto, actor: AuthenticatedUser) {
    const reason = await this.prisma.lossReason.findFirst({
      where: { id, tenantId: actor.tenantId },
    });
    if (!reason) throw new NotFoundException('Motivo de pérdida no encontrado');

    return this.prisma.lossReason.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const reason = await this.prisma.lossReason.findFirst({
      where: { id, tenantId: actor.tenantId },
    });
    if (!reason) throw new NotFoundException('Motivo de pérdida no encontrado');

    await this.prisma.lossReason.delete({ where: { id } });
    return { deleted: true };
  }
}
