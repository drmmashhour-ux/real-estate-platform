FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api-gateway/package.json apps/api-gateway/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY services/merchant-payment-platform/package.json services/merchant-payment-platform/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @nexora/api-gateway run build
EXPOSE 4000
CMD ["pnpm", "--filter", "@nexora/api-gateway", "start"]
