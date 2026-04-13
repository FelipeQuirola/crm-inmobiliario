import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { ReportsService } from './reports.service';
import { ReportsQueryDto, TimelineQueryDto } from './dto/reports-query.dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  overview(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() dto: ReportsQueryDto,
  ) {
    return this.reportsService.overview(actor, dto);
  }

  @Get('by-stage')
  byStage(@CurrentUser() actor: AuthenticatedUser) {
    return this.reportsService.byStage(actor);
  }

  @Get('by-source')
  bySource(@CurrentUser() actor: AuthenticatedUser) {
    return this.reportsService.bySource(actor);
  }

  @Get('by-seller')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  bySeller(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() dto: ReportsQueryDto,
  ) {
    return this.reportsService.bySeller(actor, dto);
  }

  @Get('timeline')
  timeline(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() dto: TimelineQueryDto,
  ) {
    return this.reportsService.timeline(actor, dto);
  }

  @Get('projected-revenue')
  projectedRevenue(@CurrentUser() actor: AuthenticatedUser) {
    return this.reportsService.projectedRevenue(actor);
  }

  @Get('lost-by-reason')
  lostByReason(@CurrentUser() actor: AuthenticatedUser) {
    return this.reportsService.lostByReason(actor);
  }

  @Get('velocity')
  velocity(@CurrentUser() actor: AuthenticatedUser) {
    return this.reportsService.velocity(actor);
  }
}
