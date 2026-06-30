import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ACCESS_COOKIE } from './cookies';

/** Foydalanuvchi ma'lumoti so'rovga biriktiriladi. */
export interface AuthedRequest extends Request {
  user?: { id: string };
}

/**
 * httpOnly cookie'dagi access JWT'ni tekshiradi.
 * Yaroqli bo'lsa `req.user = { id }` o'rnatadi, aks holda 401.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = (req.cookies as Record<string, string> | undefined)?.[
      ACCESS_COOKIE
    ];
    if (!token) {
      throw new UnauthorizedException('Kirish talab qilinadi.');
    }
    try {
      const userId = this.auth.verifyAccess(token);
      req.user = { id: userId };
      return true;
    } catch {
      throw new UnauthorizedException('Sessiya muddati tugagan.');
    }
  }
}
