FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY services/merchant-payment-platform/package.json services/merchant-payment-platform/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @nexora/dashboard run build
EXPOSE 4001
CMD ["pnpm", "--filter", "@nexora/dashboard", "start"]
