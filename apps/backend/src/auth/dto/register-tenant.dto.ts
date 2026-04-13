import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  tenantName: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'tenantSlug solo puede contener letras minúsculas, números y guiones',
  })
  @MinLength(2)
  @MaxLength(50)
  tenantSlug: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  adminName: string;

  @IsEmail({}, { message: 'adminEmail debe ser un email válido' })
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  adminEmail: string;

  @IsString()
  @MinLength(8, { message: 'adminPassword debe tener al menos 8 caracteres' })
  @MaxLength(72)
  adminPassword: string;
}
