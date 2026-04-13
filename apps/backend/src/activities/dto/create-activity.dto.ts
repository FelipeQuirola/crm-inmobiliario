import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ActivityType } from '@prisma/client';

// Only manual activity types are allowed via this endpoint
const MANUAL_TYPES = [
  ActivityType.NOTE,
  ActivityType.CALL,
  ActivityType.EMAIL,
  ActivityType.WHATSAPP,
  ActivityType.MEETING,
] as const;

export type ManualActivityType = (typeof MANUAL_TYPES)[number];

class ActivityMetadataDto {
  @IsOptional()
  @IsInt()
  duration?: number; // minutes — for CALL

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string; // datetime — for MEETING
}

export class CreateActivityDto {
  @IsEnum(MANUAL_TYPES, {
    message: `type debe ser uno de: ${MANUAL_TYPES.join(', ')}`,
  })
  type!: ManualActivityType;

  @IsString()
  @MinLength(1, { message: 'La descripción no puede estar vacía' })
  description!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ActivityMetadataDto)
  metadata?: ActivityMetadataDto;
}
