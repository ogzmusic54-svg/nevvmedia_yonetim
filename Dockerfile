# =========================================
# Nevvmedia Yönetim — Multi-stage Dockerfile
# =========================================

# ---------- Bağımlılıklar ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---------- Build ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client'ı üret + Next.js build
RUN npx prisma generate
RUN npm run build

# ---------- Çalışma zamanı ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl tini
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV UPLOAD_DIR=/data/uploads

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs \
 && mkdir -p /data/uploads \
 && chown -R nextjs:nodejs /data/uploads

# Next.js standalone output (kendi minimal node_modules ile)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migrate / db push / seed çalıştırabilmek için TÜM bağımlılıklar
# Standalone'un minimal node_modules'üne dokunmamak için ayrı dizinde tutulur.
# Node.js require resolution _init/node_modules'ü flat olarak çözebilir.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./_init/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Başlangıç scripti (migrate + seed + uygulama)
COPY --chown=nextjs:nodejs scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./start.sh"]
