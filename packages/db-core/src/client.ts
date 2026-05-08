import { createNoopPrismaClient } from "@repo/prisma-disabled-stub";
import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  coreDB: ReturnType<typeof createCoreClient> | undefined;
};

/**
 * Prisma 7: requires driver adapter — no datasourceUrl / empty constructor.
 */
function createCoreClient() {
  if (process.env.NEXT_PUBLIC_DISABLE_DB === "true") {
    return createNoopPrismaClient() as unknown as ReturnType<typeof createCoreClientReal>;
  }
  return createCoreClientReal();
}

function createCoreClientReal() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not set — required for db-core.");
  const adapter = new PrismaPg({ connectionString: url });
  const base = new PrismaClient({ adapter });

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
