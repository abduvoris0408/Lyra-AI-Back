import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './jwt-auth.guard';

/**
 * Controller metodiga joriy foydalanuvchi id'sini beradi.
 * JwtAuthGuard bilan birga ishlatiladi.
 *   stream(@CurrentUser() userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    return req.user?.id ?? '';
  },
);
