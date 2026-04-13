import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource, LeadStatus } from '@prisma/client';

export class ListLeadsDto {
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ description: 'UUID de la etapa del pipeline' })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional({ description: 'UUID del vendedor (solo ADMIN)' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({ description: 'Busca en nombre, email y teléfono' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ID del último elemento para paginación cursor-based' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
