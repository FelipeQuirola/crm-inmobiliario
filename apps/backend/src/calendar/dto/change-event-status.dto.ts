import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CalendarEventStatus } from '@prisma/client';

export class ChangeEventStatusDto {
  @ApiProperty({ enum: CalendarEventStatus })
  @IsEnum(CalendarEventStatus)
  status: CalendarEventStatus;
}
