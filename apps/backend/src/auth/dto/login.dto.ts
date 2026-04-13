import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail({}, { message: 'email debe ser un email válido' })
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(1, { message: 'password es requerido' })
  password: string;

  @IsString()
  @MinLength(1, { message: 'tenantSlug es requerido' })
  tenantSlug: string;
}
