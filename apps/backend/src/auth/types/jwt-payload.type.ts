import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  tenantId: string;
}

export interface JwtRefreshPayload extends JwtPayload {
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
}

export interface RequestWithTenant extends Request {
  tenantId?: string;
  user?: AuthenticatedUser;
}
