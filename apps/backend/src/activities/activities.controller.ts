import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ListActivitiesDto } from './dto/list-activities.dto';

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('leads/:leadId/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.activitiesService.create(leadId, dto, actor);
  }

  @Get()
  list(
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Query() dto: ListActivitiesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.activitiesService.list(leadId, dto, actor);
  }

  @Delete(':activityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.activitiesService.remove(leadId, activityId, actor);
  }
}
