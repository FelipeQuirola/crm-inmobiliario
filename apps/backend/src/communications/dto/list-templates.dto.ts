import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { MessageType } from '@prisma/client';

export class ListTemplatesDto {
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  @Transform(({ value }) => value === 'false' ? false : value === 'true' ? true : undefined)
  @IsBoolean()
  includeInactive?: boolean;
}
