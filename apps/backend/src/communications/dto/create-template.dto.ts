import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { MessageType } from '@prisma/client';

export class CreateTemplateDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  @MinLength(1)
  body: string;
}
