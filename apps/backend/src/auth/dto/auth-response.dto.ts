import { Role } from '@prisma/client';

export class AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export class AuthUserDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
}

export class AuthResponseDto {
  user: AuthUserDto;
  accessToken: string;
  refreshToken: string;
}
