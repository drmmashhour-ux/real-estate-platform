FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/financial-core/package.json services/financial-core/package.json
COPY services/merchant-payment-platform/package.json services/merchant-payment-platform/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @nexora/financial-core run build
EXPOSE 4100
CMD ["pnpm", "--filter", "@nexora/financial-core", "start"]
