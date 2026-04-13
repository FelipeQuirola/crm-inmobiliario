import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { ChangeEventStatusDto } from './dto/change-event-status.dto';
import { ListCalendarEventsDto } from './dto/list-calendar-events.dto';

@ApiTags('calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('today')
  today(@CurrentUser() actor: AuthenticatedUser) {
    return this.calendarService.today(actor);
  }

  @Get()
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() dto: ListCalendarEventsDto,
  ) {
    return this.calendarService.list(actor, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.calendarService.create(actor, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    return this.calendarService.update(actor, id, dto);
  }

  @Patch(':id/status')
  changeStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeEventStatusDto,
  ) {
    return this.calendarService.changeStatus(actor, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.calendarService.remove(actor, id);
  }
}
