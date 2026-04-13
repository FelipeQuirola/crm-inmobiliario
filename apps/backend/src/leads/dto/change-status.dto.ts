import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';

export class ChangeStatusDto {
  @ApiProperty({ enum: LeadStatus, description: 'Nuevo estado del lead' })
  @IsEnum(LeadStatus)
  status: LeadStatus;

  @ApiPropertyOptional({
    example: 'El cliente compró con otra agencia.',
    description: 'Texto libre de pérdida (opcional, preferir lossReasonId)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lostReason?: string;

  @ApiPropertyOptional({
    description: 'ID del motivo de pérdida (LossReason). Obligatorio cuando status es LOST.',
  })
  @ValidateIf((o: ChangeStatusDto) => o.status === LeadStatus.LOST)
  @IsUUID()
  lossReasonId?: string;
}
