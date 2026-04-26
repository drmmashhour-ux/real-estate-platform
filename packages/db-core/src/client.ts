import { PrismaClient } from "../generated/client";

const globalForPrisma = globalThis as unknown as {
  coreDB: ReturnType<typeof createCoreClient> | undefined;
};

/**
 * Prisma 7+ uses `.$extends` for middleware-style hooks (`.$use` is not available on the public client).
 * Observability: built-in `log` for query/error/warn, plus per-operation timing in `[DB]`.
 */
function createCoreClient() {
  const log: Array<"query" | "error" | "warn"> = ["query", "error", "warn"];

  const base = new PrismaClient({ log });

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = Date.now();
          const result = await query(args);
          const duration = Date.now() - start;
          const label = model != null ? `${String(model)}.${String(operation)}` : String(operation);
          console.log(`[DB] ${label} (${duration}ms)`);
          return result;
        },
      },
    },
  });
}

/**
 * One client per process (dev HMR + long-lived prod workers). Reuse via `globalThis` to
 * limit connection churn and memory (aligns with LECIPM scale / ORDER 7–8).
 */
export const coreDB = (() => {
  if (!globalForPrisma.coreDB) {
    globalForPrisma.coreDB = createCoreClient();
  }
  return globalForPrisma.coreDB;
})();

/** Alias for code that still expects `prisma` from this package. */
export const prisma = coreDB;
