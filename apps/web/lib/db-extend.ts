/**
 * Prisma client extension: log duration per model operation (core vs monolith in {@link withTracing} label).
 */
export function withTracing(prisma: { $extends: (args: unknown) => unknown }, label: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }: { operation: string; model?: string; args: unknown; query: (a: unknown) => Promise<unknown> }) {
          const start = Date.now();
          const result = await query(args);
          const duration = Date.now() - start;
          if (duration > 300) {
            console.warn("[PRISMA SLOW]", {
              label,
              model,
              action: operation,
              duration,
            });
          } else if (process.env.PRISMA_EXT_TRACE === "1") {
            console.log(`[DB TRACE] ${label}.${String(model ?? "?")}.${operation} - ${duration}ms`);
          }
          return result;
        },
      },
    },
  });
}
