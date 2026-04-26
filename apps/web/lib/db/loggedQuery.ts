/**
 * Order 94 — time Prisma and other async DB work for local logs / performance tuning.
 */
export async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    console.log(`[DB] ${label} took ${Date.now() - start}ms`);
    return result;
  } catch (e) {
    console.error(`[DB ERROR] ${label}`, e);
    throw e;
  }
}
