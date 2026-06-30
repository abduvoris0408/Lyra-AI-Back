import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { UsersService, type GoogleProfile } from '../users/users.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  sub: string; // userId
}

/**
 * Google identifikatsiyasini serverda tekshiradi va o'z JWT sessiyamizni beradi.
 *
 * Ikki kirish formatini qo'llab-quvvatlaydi:
 *  - `credential`  : Google ID token (eng to'g'ri — audience tekshiriladi).
 *  - `accessToken` : GIS OAuth access token (server userinfo orqali tekshiradi).
 *
 * Har ikkala holatda ham bizning sessiyamiz server tomonida imzolangan JWT bo'ladi.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly oauthClient: OAuth2Client;

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {
    this.oauthClient = new OAuth2Client(this.googleClientId);
  }

  private get googleClientId(): string {
    return this.config.get<string>('GOOGLE_CLIENT_ID') ?? '';
  }

  /** Google credential/access tokenni tekshirib, profilni qaytaradi. */
  async verifyGoogle(input: {
    credential?: string;
    accessToken?: string;
  }): Promise<GoogleProfile> {
    if (input.credential) return this.verifyIdToken(input.credential);
    if (input.accessToken) return this.verifyAccessToken(input.accessToken);
    throw new UnauthorizedException('Google credential yoki accessToken kerak.');
  }

  /** ID token (JWT) — audience (client_id) ga bog'langan, eng ishonchli. */
  private async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    try {
      const ticket = await this.oauthClient.verifyIdToken({
        idToken,
        audience: this.googleClientId,
      });
      const p = ticket.getPayload();
      if (!p?.sub || !p.email) {
        throw new UnauthorizedException('Google token to`liq emas.');
      }
      return {
        googleId: p.sub,
        email: p.email,
        name: p.name,
        avatarUrl: p.picture,
      };
    } catch (err) {
      this.logger.warn(`ID token tekshiruvi muvaffaqiyatsiz: ${(err as Error)?.message}`);
      throw new UnauthorizedException('Google token yaroqsiz.');
    }
  }

  /** Access token — Google userinfo orqali server tomonda tekshiriladi. */
  private async verifyAccessToken(accessToken: string): Promise<GoogleProfile> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new UnauthorizedException('Google access token yaroqsiz.');
    }
    const info = (await res.json()) as {
      sub: string;
      email?: string;
      name?: string;
      picture?: string;
    };
    if (!info.sub || !info.email) {
      throw new UnauthorizedException('Google profili to`liq emas.');
    }
    return {
      googleId: info.sub,
      email: info.email,
      name: info.name,
      avatarUrl: info.picture,
    };
  }

  /** Foydalanuvchi uchun access + refresh JWT juftligini imzolaydi. */
  issueTokens(userId: string): TokenPair {
    const payload: JwtPayload = { sub: userId };
    const accessToken = this.jwt.sign(payload, {
      secret: this.accessSecret,
      expiresIn: '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: '30d',
    });
    return { accessToken, refreshToken };
  }

  /** Access tokenni tekshiradi → userId. Guard ishlatadi. */
  verifyAccess(token: string): string {
    const payload = this.jwt.verify<JwtPayload>(token, {
      secret: this.accessSecret,
    });
    return payload.sub;
  }

  /** Refresh tokenni tekshiradi → userId. */
  verifyRefreshToken(token: string): string {
    const payload = this.jwt.verify<JwtPayload>(token, {
      secret: this.refreshSecret,
    });
    return payload.sub;
  }

  upsertUser(profile: GoogleProfile) {
    return this.users.upsertFromGoogle(profile);
  }

  private get accessSecret(): string {
    return this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-access-secret';
  }

  private get refreshSecret(): string {
    return this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret';
  }
}
