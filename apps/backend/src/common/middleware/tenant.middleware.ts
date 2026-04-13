import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, NextFunction } from 'express';
import { verify, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { JwtPayload, RequestWithTenant } from '@/auth/types/jwt-payload.type';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly jwtAccessSecret: string;

  constructor(config: ConfigService) {
    this.jwtAccessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  use(req: RequestWithTenant, _res: Response, next: NextFunction): void {
    const authHeader = (req as unknown as { headers: Record<string, string> }).headers['authorization'];

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = verify(token, this.jwtAccessSecret) as JwtPayload;
        if (payload.tenantId) {
          req.tenantId = payload.tenantId;
        }
      } catch (err) {
        if (!(err instanceof JsonWebTokenError) && !(err instanceof TokenExpiredError)) {
          throw err;
        }
        // Token inválido o expirado — el JwtAuthGuard manejará el rechazo
      }
    }

    next();
  }
}
