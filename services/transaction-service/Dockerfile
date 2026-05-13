FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/transaction-service/package.json services/transaction-service/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @nexora/transaction-service run build
EXPOSE 4101
CMD ["pnpm", "--filter", "@nexora/transaction-service", "start"]
