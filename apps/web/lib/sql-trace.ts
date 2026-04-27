/**
 * Wraps async SQL (e.g. `pg` `pool.query`) to log total duration for raw-SQL paths.
 */
export async function traceSQL<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  console.log(`[SQL TRACE] ${label} - ${Date.now() - start}ms`);
  return result;
}
