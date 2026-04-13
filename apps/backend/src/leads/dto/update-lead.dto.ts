import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
  IsPositive,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource } from '@prisma/client';

export class UpdateLeadDto {
  @ApiPropertyOptional({ example: 'Carlos' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Ramírez' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '+52 55 1234 5678' })
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  @Matches(/^[+\d\s\-().]+$/, {
    message: 'phone solo puede contener dígitos, +, espacios y guiones',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'carlos@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'email debe ser un correo válido' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({ example: 'Busca departamento en Polanco, 2 recámaras' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  propertyInterest?: string;

  @ApiPropertyOptional({ example: 'Nota actualizada.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ example: 3500000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  budget?: number;

  @ApiPropertyOptional({ example: '2024-02-15T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  nextActionAt?: string;

  @ApiPropertyOptional({ description: 'UUID de la etapa. null para quitar etapa.' })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional({
    description: 'UUID del vendedor asignado. null para desasignar.',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === null || value === '' ? null : value,
  )
  @ValidateIf((o: UpdateLeadDto) => o.assignedToId !== null)
  @IsUUID()
  assignedToId?: string | null;
}
