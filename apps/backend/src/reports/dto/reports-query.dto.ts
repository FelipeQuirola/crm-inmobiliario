import { IsOptional, IsString, IsEnum } from 'class-validator';

export class ReportsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class TimelineQueryDto extends ReportsQueryDto {
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';
}
