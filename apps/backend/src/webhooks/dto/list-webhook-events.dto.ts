import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookProvider, WebhookStatus } from '@prisma/client';

export class ListWebhookEventsDto {
  @ApiPropertyOptional({ enum: WebhookProvider })
  @IsOptional()
  @IsEnum(WebhookProvider)
  provider?: WebhookProvider;

  @ApiPropertyOptional({ enum: WebhookStatus })
  @IsOptional()
  @IsEnum(WebhookStatus)
  status?: WebhookStatus;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
