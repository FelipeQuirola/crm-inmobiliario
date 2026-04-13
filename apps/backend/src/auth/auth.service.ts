import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload, JwtRefreshPayload } from './types/jwt-payload.type';

const BCRYPT_ROUNDS = 12;

const DEFAULT_PIPELINE_STAGES = [
  { name: 'Lead', order: 1, color: '#6B7280', isDefault: true },
  { name: 'Oportunidad', order: 2, color: '#3B82F6', isDefault: false },
  { name: 'Calificación', order: 3, color: '#F59E0B', isDefault: false },
  { name: 'Cierre', order: 4, color: '#10B981', isDefault: false },
];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async registerTenant(dto: RegisterTenantDto): Promise<AuthResponseDto> {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });

    if (existingTenant) {
      throw new ConflictException(
        `El slug '${dto.tenantSlug}' ya está en uso. Elige otro.`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, BCRYPT_ROUNDS);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.tenantName,
        slug: dto.tenantSlug,
        users: {
          create: {
            name: dto.adminName,
            email: dto.adminEmail,
            password: passwordHash,
            role: Role.ADMIN,
          },
        },
        pipelineStages: {
          createMany: { data: DEFAULT_PIPELINE_STAGES },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            tenantId: true,
          },
        },
      },
    });

    const user = tenant.users[0];
    return this.buildAuthResponse(user.id, user.email, user.name, user.role, tenant.id);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });

    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId: tenant.id,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildAuthResponse(user.id, user.email, user.name, user.role, tenant.id);
  }

  async refreshTokens(payload: JwtRefreshPayload): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId,
        isActive: true,
      },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Acceso denegado');
    }

    const tokenMatches = await bcrypt.compare(
      payload.refreshToken,
      user.refreshTokenHash,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    return this.buildAuthResponse(user.id, user.email, user.name, user.role, user.tenantId);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async getProfile(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  private async buildAuthResponse(
    userId: string,
    email: string,
    name: string,
    role: Role,
    tenantId: string,
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: userId, email, role, tenantId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });

    return {
      user: { id: userId, email, name, role, tenantId },
      accessToken,
      refreshToken,
    };
  }
}
