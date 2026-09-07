FROM node:lts-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./

COPY ./packages/backend/package.json ./packages/backend/package.json
COPY ./packages/common/package.json ./packages/common/package.json

RUN npm ci --prefer-offline --no-audit

COPY ./packages/backend/ ./packages/backend/
COPY ./packages/common/ ./packages/common/


# Dummy database url to generate prisma schema
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx -w @accounting-app/backend prisma generate

RUN npm -w @accounting-app/backend run build

FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
COPY ./packages/backend/package.json ./packages/backend/
COPY ./packages/common/package.json ./packages/common/

COPY --from=builder /app/node_modules ./node_modules

RUN npm ci --prefer-offline --no-audit --omit=dev

COPY --from=builder /app/packages/backend/build ./

HEALTHCHECK --interval=30s --timeout=10s --start-period=1s --start-interval=5s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/health || exit 1

ENV NODE_ENV=production

ENTRYPOINT ["node", "./index.js"]
