import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkLeadDto {
  @ApiProperty()
  @IsString()
  leadId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
