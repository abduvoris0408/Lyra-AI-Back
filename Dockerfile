# ===== Build bosqichi =====
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

# Prisma sxema/config'ni install'dan OLDIN ko'chiramiz, chunki `pnpm install`
# `postinstall: prisma generate`ni chaqiradi va u prisma/schema.prisma'ni izlaydi.
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

# ===== Ishga tushirish bosqichi =====
FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production

# Bu yerda ham prisma/ install'dan oldin kerak (postinstall generate uchun).
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm install --prod --no-frozen-lockfile

COPY --from=build /app/dist ./dist

# Render/Railway PORT ni o'zi beradi; main.ts uni o'qiydi
EXPOSE 3001
CMD ["node", "dist/main.js"]
