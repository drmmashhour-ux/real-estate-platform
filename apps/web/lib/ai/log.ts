import "server-only";

/**
 * Lightweight AI event hook for API routes. Extend with persistence later; default is dev-only echo.
 */
export function logAiEvent(eventType: string, meta?: Record<string, unknown>): void {
  if (process.env.AI_LOG_EVENTS === "1") {
    console.info(`[ai:${eventType}]`, meta ?? {});
  }
}
