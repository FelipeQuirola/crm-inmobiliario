import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeOwnPasswordDto } from './dto/change-own-password.dto';

const BCRYPT_ROUNDS = 12;

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  avatarUrl: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── LIST ─────────────────────────────────────────────────────────────────

  async findAllInTenant(actor: AuthenticatedUser) {
    return this.prisma.user.findMany({
      where: { tenantId: actor.tenantId },
      select: {
        ...USER_SELECT,
        _count: {
          select: {
            assignedLeads: {
              where: {
                deletedAt: null,
                status: { in: ['ACTIVE', 'PAUSED'] },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // ─── FIND ONE ─────────────────────────────────────────────────────────────

  async findOne(id: string, actor: AuthenticatedUser) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId: actor.tenantId },
      select: {
        ...USER_SELECT,
        assignedLeads: {
          where: { deletedAt: null, status: { in: ['ACTIVE', 'PAUSED'] } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            stage: { select: { id: true, name: true, color: true } },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            assignedLeads: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const [activeLeads, wonLeads] = await Promise.all([
      this.prisma.lead.count({
        where: {
          tenantId: actor.tenantId,
          assignedToId: id,
          deletedAt: null,
          status: { in: ['ACTIVE', 'PAUSED'] },
        },
      }),
      this.prisma.lead.count({
        where: {
          tenantId: actor.tenantId,
          assignedToId: id,
          deletedAt: null,
          status: 'WON',
        },
      }),
    ]);

    return {
      ...user,
      metrics: {
        totalLeads: user._count.assignedLeads,
        activeLeads,
        wonLeads,
      },
    };
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto, actor: AuthenticatedUser) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId: actor.tenantId },
    });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con este email en el tenant');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
        role: dto.role ?? Role.VENDEDOR,
        tenantId: actor.tenantId,
      },
      select: USER_SELECT,
    });
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateUserDto, actor: AuthenticatedUser) {
    const target = await this.prisma.user.findFirst({
      where: { id, tenantId: actor.tenantId },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    // Prevent self-role-change and self-deactivation
    if (id === actor.id) {
      if (dto.role !== undefined && dto.role !== target.role) {
        throw new ForbiddenException('No puedes cambiar tu propio rol');
      }
      if (dto.isActive === false) {
        throw new ForbiddenException('No puedes desactivarte a ti mismo');
      }
    }

    // Check email uniqueness if email is being changed
    if (dto.email && dto.email !== target.email) {
      const emailConflict = await this.prisma.user.findFirst({
        where: { email: dto.email, tenantId: actor.tenantId, id: { not: id } },
      });
      if (emailConflict) {
        throw new ConflictException('El email ya está en uso por otro usuario');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: USER_SELECT,
    });
  }

  // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────

  async changePassword(id: string, dto: ChangePasswordDto, actor: AuthenticatedUser) {
    const target = await this.prisma.user.findFirst({
      where: { id, tenantId: actor.tenantId },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id },
      data: { password: passwordHash, refreshTokenHash: null },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  // ─── DEACTIVATE ───────────────────────────────────────────────────────────

  async deactivate(id: string, actor: AuthenticatedUser) {
    if (id === actor.id) {
      throw new ForbiddenException('No puedes desactivarte a ti mismo');
    }

    const target = await this.prisma.user.findFirst({
      where: { id, tenantId: actor.tenantId },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    if (!target.isActive) {
      throw new BadRequestException('El usuario ya está inactivo');
    }

    // Soft disable + unassign active leads
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isActive: false, refreshTokenHash: null },
      }),
      this.prisma.lead.updateMany({
        where: {
          tenantId: actor.tenantId,
          assignedToId: id,
          deletedAt: null,
          status: { in: ['ACTIVE', 'PAUSED'] },
        },
        data: { assignedToId: null },
      }),
    ]);

    return { message: 'Usuario desactivado y leads reasignados correctamente' };
  }

  // ─── LIST ACTIVE (for assignment selectors) ────────────────────────────────

  async findActiveInTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      orderBy: { name: 'asc' },
    });
  }

  // ─── PROFILE ──────────────────────────────────────────────────────────────

  async getProfile(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        ...USER_SELECT,
        tenant: { select: { name: true, slug: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(userId: string, tenantId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const conflict = await this.prisma.user.findFirst({
        where: { email: dto.email, tenantId, id: { not: userId } },
      });
      if (conflict) throw new ConflictException('El email ya está en uso por otro usuario');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
      },
      select: USER_SELECT,
    });
  }

  async changeOwnPassword(userId: string, tenantId: string, dto: ChangeOwnPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { password: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Contraseña actual incorrecta');

    const hash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hash, refreshTokenHash: null },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async updateAvatarUrl(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { avatarUrl: true },
    });
    return user;
  }
}
