FROM node:lts-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY ./packages/backend/package.json ./packages/backend/package.json

RUN npm ci

COPY ./packages/backend/ ./packages/backend/

RUN npm -w @accounting-app/backend run build
RUN npx -w @accounting-app/backend prisma generate

FROM node:lts-alpine

WORKDIR /app

COPY --from=builder /app/packages/backend/package.json ./

RUN npm i --omit=dev &&\
	npm cache clean --force &&\
	rm -rf /root/.npm

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma	

COPY --from=builder /app/packages/backend/build ./

HEALTHCHECK --interval=30s --timeout=10s --start-period=1s --start-interval=5s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/health || exit 1

ENV NODE_ENV=production

ENTRYPOINT ["node", "./index.js"]
