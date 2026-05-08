FROM node:20-alpine AS base
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Build (generate Prisma client) ───────────────────────
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate

# ── Production image ──────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 appuser

COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY src    ./src

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/app.js"]
