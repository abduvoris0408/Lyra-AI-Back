# ===== Build bosqichi =====
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

# ===== Ishga tushirish bosqichi =====
FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --no-frozen-lockfile

COPY --from=build /app/dist ./dist

# Render/Railway PORT ni o'zi beradi; main.ts uni o'qiydi
EXPOSE 3001
CMD ["node", "dist/main.js"]
