import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from './cookies';
import { UsersService } from '../users/users.service';

/** Frontend AuthUser bilan mos keladigan ommaviy foydalanuvchi shakli. */
function toAuthUser(u: User) {
  return {
    id: u.id,
    name: u.name ?? u.email,
    email: u.email,
    picture: u.avatarUrl ?? undefined,
    plan: u.plan,
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private get cookieOpts() {
    return {
      isProd: this.config.get<string>('NODE_ENV') === 'production',
      domain: this.config.get<string>('COOKIE_DOMAIN') || undefined,
    };
  }

  /** POST /auth/google — Google bilan kirish; JWT cookie'larini o'rnatadi. */
  @Post('google')
  async google(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const profile = await this.auth.verifyGoogle(dto);
    const user = await this.auth.upsertUser(profile);
    const tokens = this.auth.issueTokens(user.id);
    setAuthCookies(res, tokens, this.cookieOpts);
    return toAuthUser(user);
  }

  /** POST /auth/refresh — refresh cookie orqali yangi access token. */
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE
    ];
    if (!token) throw new UnauthorizedException('Sessiya topilmadi.');

    let userId: string;
    try {
      userId = this.auth.verifyRefreshToken(token);
    } catch {
      clearAuthCookies(res, this.cookieOpts);
      throw new UnauthorizedException('Sessiya muddati tugagan.');
    }

    const user = await this.users.findById(userId);
    if (!user) {
      clearAuthCookies(res, this.cookieOpts);
      throw new UnauthorizedException('Foydalanuvchi topilmadi.');
    }

    const tokens = this.auth.issueTokens(user.id);
    setAuthCookies(res, tokens, this.cookieOpts);
    return toAuthUser(user);
  }

  /** POST /auth/logout — cookie'larni tozalaydi. */
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookies(res, this.cookieOpts);
    return { ok: true };
  }

  /** GET /auth/me — joriy foydalanuvchi. */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    return toAuthUser(user);
  }
}
