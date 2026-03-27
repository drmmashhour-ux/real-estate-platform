/**
 * Structured API error logging for development (no PII payloads).
 */
export function logApiRouteError(route: string, err: unknown): void {
  if (process.env.NODE_ENV !== "development") return;
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[api] ${route} ${msg}`);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
}
