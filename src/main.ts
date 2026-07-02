import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  // bodyParser: false — o'rniga limiti kattaroq bo'lgan parserni o'zimiz
  // qo'shamiz (pastda). Express default limiti 100KB bo'lib, rasm/PDF
  // biriktirilgan chat so'rovlari 413 (Payload Too Large) bilan rad etilardi.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);

  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  // ETag'ni o'chiramiz — aks holda /auth/me kabi JSON javoblar 304 (Not Modified)
  // qaytarib, brauzer keshidan beriladi. Bunda fetch'da res.ok=false bo'lib,
  // getSession() noto'g'ri "sessiya yo'q" deb hisoblaydi.
  const expressApp = app.getHttpAdapter().getInstance() as {
    set(key: string, value: unknown): void;
  };
  expressApp.set('etag', false);

  // httpOnly JWT cookie'larini o'qish uchun
  app.use(cookieParser());

  // CORS — frontend (Next.js) bilan cookie/credential almashinuvi uchun.
  // Ruxsat: WEB_ORIGIN ro'yxatidagi aniq manzillar + localhost (dev) + har qanday
  // *.vercel.app (preview deploylar uchun). Origin mos kelsa, cors paketi uni
  // aks ettiradi (credentials bilan `*` ishlamaydi).
  const allowList = (config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const isAllowedOrigin = (origin: string): boolean =>
    allowList.includes(origin) ||
    /^http:\/\/localhost(:\d+)?$/i.test(origin) ||
    /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin);

  app.enableCors({
    origin: (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => {
      // origin yo'q (curl, server-to-server, same-origin) — ruxsat
      if (!origin) return cb(null, true);
      cb(null, isAllowedOrigin(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 Lyra API ishga tushdi:  http://localhost:${port}`);
}

void bootstrap();
