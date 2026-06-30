import type { CookieOptions, Response } from 'express';

export const ACCESS_COOKIE = 'lyra_access';
export const REFRESH_COOKIE = 'lyra_refresh';

const FIFTEEN_MIN = 15 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/**
 * Cookie sozlamalari.
 *
 * Prod'da frontend (Vercel) va backend (Render) turli domenlarda bo'ladi —
 * bu "cross-site" hisoblanadi. Shuning uchun `sameSite='none'` + `secure=true`
 * shart, aks holda brauzer cookie'ni yubormaydi. Bitta domen ostidagi
 * subdomenlar uchun COOKIE_DOMAIN (masalan `.lyra.app`) berilishi mumkin.
 *
 * localhost'da sameSite=lax kifoya (port farqi "site"ga ta'sir qilmaydi).
 */
function baseOptions(isProd: boolean, domain?: string): CookieOptions {
  return {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/',
    ...(domain ? { domain } : {}),
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  opts: { isProd: boolean; domain?: string },
): void {
  const base = baseOptions(opts.isProd, opts.domain);
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: FIFTEEN_MIN,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: THIRTY_DAYS,
  });
}

export function clearAuthCookies(
  res: Response,
  opts: { isProd: boolean; domain?: string },
): void {
  const base = baseOptions(opts.isProd, opts.domain);
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}
