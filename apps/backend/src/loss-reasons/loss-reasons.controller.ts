import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { LossReasonsService } from './loss-reasons.service';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateLossReasonDto, UpdateLossReasonDto } from './dto/loss-reason.dto';

@Controller('loss-reasons')
export class LossReasonsController {
  constructor(private readonly lossReasonsService: LossReasonsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.lossReasonsService.findAll(user);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateLossReasonDto, @CurrentUser() user: AuthenticatedUser) {
    return this.lossReasonsService.create(dto, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLossReasonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lossReasonsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lossReasonsService.remove(id, user);
  }
}
