import { Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class ScoringLeadsController {
  constructor(
    private readonly scoringService: ScoringService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':leadId/score')
  async getScore(
    @Param('leadId') leadId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Verify lead belongs to tenant
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    const score = await this.scoringService.getScore(leadId, user.tenantId);
    return score ?? null;
  }

  @Post(':leadId/score/recalculate')
  async recalculate(
    @Param('leadId') leadId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    await this.scoringService.calculateScore(leadId, user.tenantId);
    return this.scoringService.getScore(leadId, user.tenantId);
  }
}

@Controller('scoring')
@UseGuards(JwtAuthGuard)
export class ScoringInsightsController {
  constructor(private readonly scoringService: ScoringService) {}

  @Get('insights')
  getInsights(@CurrentUser() user: AuthenticatedUser) {
    const assignedToId = user.role === Role.VENDEDOR ? user.id : undefined;
    return this.scoringService.getInsights(user.tenantId, assignedToId);
  }
}
