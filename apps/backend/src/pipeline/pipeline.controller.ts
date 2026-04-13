import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { MoveLeadDto } from './dto/move-lead.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { CreateChecklistItemDto, UpdateChecklistItemDto } from './dto/checklist-item.dto';

@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  // ─── Stages ────────────────────────────────────────────────────────────────

  @Get('stages')
  getStages(@CurrentUser() user: AuthenticatedUser) {
    return this.pipelineService.getStages(user);
  }

  @Post('stages')
  @Roles(Role.ADMIN)
  createStage(@Body() dto: CreateStageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pipelineService.createStage(dto, user);
  }

  @Patch('stages/reorder')
  @Roles(Role.ADMIN)
  reorderStages(@Body() dto: ReorderStagesDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pipelineService.reorderStages(dto, user);
  }

  @Patch('stages/:id')
  @Roles(Role.ADMIN)
  updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pipelineService.updateStage(id, dto, user);
  }

  @Delete('stages/:id')
  @Roles(Role.ADMIN)
  deleteStage(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.pipelineService.deleteStage(id, user);
  }

  // ─── Stage checklists ──────────────────────────────────────────────────────

  @Get('stages/:stageId/checklist')
  @Roles(Role.ADMIN)
  getStageChecklists(
    @Param('stageId') stageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pipelineService.getStageChecklists(stageId, user);
  }

  @Post('stages/:stageId/checklist')
  @Roles(Role.ADMIN)
  createChecklistItem(
    @Param('stageId') stageId: string,
    @Body() dto: CreateChecklistItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pipelineService.createChecklistItem(stageId, dto, user);
  }

  @Patch('stages/:stageId/checklist/:itemId')
  @Roles(Role.ADMIN)
  updateChecklistItem(
    @Param('stageId') stageId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pipelineService.updateChecklistItem(stageId, itemId, dto, user);
  }

  @Delete('stages/:stageId/checklist/:itemId')
  @Roles(Role.ADMIN)
  deleteChecklistItem(
    @Param('stageId') stageId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pipelineService.deleteChecklistItem(stageId, itemId, user);
  }

  // ─── Board ─────────────────────────────────────────────────────────────────

  @Get()
  getBoard(@CurrentUser() user: AuthenticatedUser) {
    return this.pipelineService.getBoard(user);
  }

  // ─── Lead stage move ───────────────────────────────────────────────────────

  @Patch('leads/:id/stage')
  moveToStage(
    @Param('id') id: string,
    @Body() dto: MoveLeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pipelineService.moveToStage(id, dto.stageId, user);
  }

  // ─── Lead checklist progress ───────────────────────────────────────────────

  @Get('leads/:id/checklist')
  getLeadChecklist(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.pipelineService.getLeadChecklist(id, user);
  }

  @Patch('leads/:id/checklist/:checklistId')
  toggleLeadChecklistItem(
    @Param('id') id: string,
    @Param('checklistId') checklistId: string,
    @Body('isDone') isDone: boolean,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pipelineService.toggleLeadChecklistItem(id, checklistId, isDone, user);
  }

  // ─── Lead stage history ────────────────────────────────────────────────────

  @Get('leads/:id/stage-history')
  getLeadStageHistory(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.pipelineService.getLeadStageHistory(id, user);
  }
}
