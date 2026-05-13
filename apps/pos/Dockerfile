FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/pos/package.json apps/pos/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY services/merchant-payment-platform/package.json services/merchant-payment-platform/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @nexora/pos run build
EXPOSE 4002
CMD ["pnpm", "--filter", "@nexora/pos", "start"]
