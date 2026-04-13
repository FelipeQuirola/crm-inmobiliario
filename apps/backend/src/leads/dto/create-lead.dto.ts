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
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource } from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty({ example: 'Carlos' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Ramírez' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: '+52 55 1234 5678', description: 'Teléfono (cualquier formato)' })
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  @Matches(/^[+\d\s\-().]+$/, { message: 'phone solo puede contener dígitos, +, espacios y guiones' })
  phone: string;

  @ApiPropertyOptional({ example: 'carlos.ramirez@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'email debe ser un correo válido' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({ enum: LeadSource, default: LeadSource.MANUAL })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({ example: 'Busca departamento en Polanco, 2 recámaras' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  propertyInterest?: string;

  @ApiPropertyOptional({ example: 'Llegó por recomendación de un cliente.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ example: 3500000, description: 'Presupuesto en MXN' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  budget?: number;

  @ApiPropertyOptional({ description: 'UUID del vendedor al que se asigna (solo ADMIN)' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'UUID de la etapa del pipeline' })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional({ example: '2024-02-15T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  nextActionAt?: string;
}
