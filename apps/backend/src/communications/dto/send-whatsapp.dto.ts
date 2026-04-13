import { IsString, IsUUID, IsOptional, MinLength } from 'class-validator';

export class SendWhatsAppDto {
  @IsUUID()
  leadId: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsString()
  @MinLength(1)
  body: string;
}
