/** Dev/UI only: resolves Prisma delegates without touching the database. */

function noopModelDelegate() {
  return new Proxy(Object.create(null), {
    get(_, op: PropertyKey): unknown {
      const name = typeof op === "string" ? op : "";
      switch (name) {
        case "findMany":
        case "findRaw":
          return (): Promise<unknown[]> => Promise.resolve([]);
        case "findUnique":
        case "findFirst":
          return (): Promise<null> => Promise.resolve(null);
        case "count":
          return (): Promise<number> => Promise.resolve(0);
        case "aggregate":
          return (): Promise<Record<string, unknown>> =>
            Promise.resolve({ _count: 0, _avg: null, _sum: null, _min: null, _max: null });
        case "groupBy":
          return (): Promise<unknown[]> => Promise.resolve([]);
        case "create":
        case "createMany":
        case "update":
        case "updateMany":
        case "delete":
        case "deleteMany":
        case "upsert":
          return (): Promise<null> => {
            if (process.env.NODE_ENV !== "production") {
              console.warn("[prisma-disabled-stub] write operation skipped");
            }
            return Promise.resolve(null);
          };
        default:
          return (): Promise<null> => Promise.resolve(null);
      }
    },
  });
}

/**
 * Drop-in stand-in for `PrismaClient` when `NEXT_PUBLIC_DISABLE_DB=true`.
 * Not a full Prisma implementation — only enough for read-heavy pages to render.
 */
export function createNoopPrismaClient(): unknown {
  const self = new Proxy(Object.create(null), {
    get(_, prop: PropertyKey): unknown {
      const p = typeof prop === "string" ? prop : String(prop);
      if (p === "$connect" || p === "$disconnect") {
        return (): Promise<void> => Promise.resolve();
      }
      if (p === "$on") {
        return (): void => undefined;
      }
      if (p === "$extends") {
        return (): unknown => createNoopPrismaClient();
      }
      if (p === "$transaction") {
        return (arg: unknown): Promise<unknown> => {
          if (typeof arg === "function") {
            return (arg as (tx: unknown) => Promise<unknown>)(createNoopPrismaClient());
          }
          if (Array.isArray(arg)) {
            return Promise.all(arg);
          }
          return Promise.resolve(null);
        };
      }
      if (p.startsWith("$query") || p.startsWith("$execute")) {
        return (): Promise<unknown[]> => Promise.resolve([]);
      }
      if (p.startsWith("$")) {
        return (): Promise<null> => Promise.resolve(null);
      }
      return noopModelDelegate();
    },
  });
  return self;
}
