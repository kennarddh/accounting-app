FROM node:lts-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./

COPY ./packages/backend/package.json ./packages/backend/package.json
COPY ./packages/common/package.json ./packages/common/package.json

RUN --mount=type=cache,target=/root/.npm \
	npm ci --prefer-offline --no-audit

COPY ./packages/backend/ ./packages/backend/
COPY ./packages/common/ ./packages/common/

RUN npm -w @accounting-app/backend run build
RUN npx -w @accounting-app/backend prisma generate

FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
COPY ./packages/backend/package.json ./packages/backend/
COPY ./packages/common/package.json ./packages/common/

COPY --from=builder /app/node_modules ./node_modules

RUN --mount=type=cache,target=/root/.npm \
	npm ci --prefer-offline --no-audit --omit=dev

COPY --from=builder /app/packages/backend/build ./

HEALTHCHECK --interval=30s --timeout=10s --start-period=1s --start-interval=5s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/health || exit 1

ENV NODE_ENV=production

ENTRYPOINT ["node", "./index.js"]
