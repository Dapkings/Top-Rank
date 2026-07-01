# Stage 1: Install dependencies & generate Prisma Client
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# Stage 2: Builder untuk kompilasi Next.js production
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
# Database URL dummy untuk mengelabui Next.js saat proses build statis
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"

RUN npm run build

# Stage 3: Runner stage akhir yang super ringan
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000
ENV PORT 3000

# Perintah menjalankan migrasi skema database otomatis, lalu menyalakan server
CMD ["sh", "-c", "npx prisma db push && node server.js"]