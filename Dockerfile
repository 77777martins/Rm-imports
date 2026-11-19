# syntax=docker/dockerfile:1
# ---------------------------------------------------------------
# MedFácil — imagem de produção (Next.js standalone, multi-stage)
# ---------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1) Dependências (cache por lockfile)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Variáveis fictícias só para o build (validadas em runtime com as reais)
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    JWT_ACCESS_SECRET="build-time-placeholder-secret-not-used-at-runtime"
RUN npx prisma generate && npx next build

# 3) Runtime mínimo, usuário sem privilégios
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Migrações + seed executáveis via "docker compose run --rm migrate"
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
