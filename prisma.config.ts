import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Lokalda `.env` ni avtomatik yuklaymiz (Node 20.12+/22 built-in).
// Render/prod'da `.env` bo'lmaydi — qiymatlar process.env'da turadi, xato yutiladi.
try {
  process.loadEnvFile();
} catch {
  // .env topilmadi — process.env'dagi mavjud qiymatlardan foydalanamiz.
}

/**
 * Prisma 7 konfiguratsiyasi (CLI: migrate, db push, studio).
 * Ulanish URL'i shu yerda — sxema faylida emas. Runtime'da esa PrismaClient
 * driver adapter (@prisma/adapter-pg) bilan ishlaydi (PrismaService'ga qarang).
 *
 * `prisma generate` DB'ga ulanmaydi, shuning uchun URL bo'sh bo'lsa ham ishlaydi
 * (postinstall'da). `migrate`/`db push` esa haqiqiy DATABASE_URL talab qiladi.
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
});
