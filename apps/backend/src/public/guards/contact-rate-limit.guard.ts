import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ContactRateLimitGuard implements CanActivate {
  private readonly store = new Map<string, { count: number; resetAt: number }>();
  private readonly maxRequests = 10;
  private readonly windowMs = 60 * 1000; // 1 minute

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      'unknown';

    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now >= entry.resetAt) {
      this.store.set(ip, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      throw new HttpException(
        'Demasiadas solicitudes. Intenta de nuevo en un minuto.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count += 1;
    return true;
  }
}
