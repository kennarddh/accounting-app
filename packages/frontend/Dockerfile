FROM node:lts-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY ./packages/frontend/package.json ./packages/frontend/package.json

RUN --mount=type=cache,target=/root/.npm \
	npm ci --prefer-offline --no-audit

COPY ./packages/frontend/ ./packages/frontend/
COPY ./packages/common/ ./packages/common/
COPY ./tsconfig.json ./tsconfig.json

RUN npm -w @accounting-app/frontend run build

FROM nginx:alpine	

WORKDIR /app

COPY ./infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/packages/frontend/build/ .

HEALTHCHECK --interval=30s --timeout=10s --start-period=1s --start-interval=5s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]