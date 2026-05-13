FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/merchant-service/package.json services/merchant-service/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @nexora/merchant-service run build
EXPOSE 4102
CMD ["pnpm", "--filter", "@nexora/merchant-service", "start"]
