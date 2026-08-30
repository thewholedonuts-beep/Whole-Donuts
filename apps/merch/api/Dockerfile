FROM node:22-alpine

ENV NODE_ENV=production
ENV MIGRATIONS_DIRECTORY=/app/database/migrations
WORKDIR /app/api

COPY apps/merch/api/package.json apps/merch/api/package-lock.json ./
RUN npm ci --omit=dev

COPY apps/merch/api/src ./src
COPY data/postgres/migrations /app/database/migrations

USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3001/ready').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "src/server.js"]
