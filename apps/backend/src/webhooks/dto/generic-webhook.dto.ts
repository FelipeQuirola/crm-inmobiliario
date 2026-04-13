import { IsString, IsOptional, IsEmail } from 'class-validator';

export class GenericWebhookDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
