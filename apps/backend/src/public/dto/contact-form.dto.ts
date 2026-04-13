import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ContactFormDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @IsString()
  @MinLength(7)
  @MaxLength(20)
  @Matches(/^[+\d\s\-().]+$/, { message: 'phone solo puede contener dígitos, +, espacios y guiones' })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'email debe ser un correo válido' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  propertyInterest?: string;

  // Property ID if contacting about a specific property
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  // Tenant slug (resolved to tenantId in service)
  @IsString()
  slug: string;
}
