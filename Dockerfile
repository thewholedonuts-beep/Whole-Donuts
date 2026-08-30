# syntax=docker/dockerfile:1
# ────────────────────────────────────────────────────────────
# Multi-stage production build for wenevergonnaclose.com
# ────────────────────────────────────────────────────────────

# ── Stage 1: build merch frontend ────────────────────────────
FROM node:20-alpine AS merch-web-builder
WORKDIR /build/merch/web
COPY apps/merch/web/package*.json ./
RUN npm ci --prefer-offline
COPY apps/merch/web/ ./
RUN npm run build

# ── Stage 2: Go tools (domain-funnels + universe CLIs) ───────
FROM golang:1.22-alpine AS go-builder
WORKDIR /build

# domain-funnels
COPY tools/domain-funnels/ ./domain-funnels/
RUN cd domain-funnels && go build -o /bin/funnel-cli ./cmd/funnel-cli && \
    go build -o /bin/analytics-dashboard ./cmd/analytics-dashboard

# universe CLIs
COPY apps/universe/ ./universe/
RUN cd universe && \
    go build -o /bin/funnel-deploy ./cmd/funnel-deploy && \
    go build -o /bin/network-orchestrator ./cmd/network-orchestrator && \
    go build -o /bin/scaling-orchestrator ./cmd/scaling-orchestrator

# ── Stage 3: merch API (production) ──────────────────────────
FROM node:20-alpine AS merch-api
WORKDIR /app
ENV NODE_ENV=production
COPY apps/merch/api/package*.json ./
RUN npm ci --omit=dev
COPY apps/merch/api/ ./
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "src/server.js"]

# ── Stage 4: public site (nginx) ─────────────────────────────
FROM nginx:1.27-alpine AS public-site
COPY apps/public-site/ /usr/share/nginx/html/
COPY apps/web/ /usr/share/nginx/html/landing/
COPY --from=merch-web-builder /build/merch/web/.next/static /usr/share/nginx/html/merch/_next/static
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

# ── Default image: public site ────────────────────────────────
FROM public-site
