/**
 * Centralized server-side error logging. Extend with Sentry/Datadog in one place.
 */
function serializeError(error: unknown): { message?: string; stack?: string; name?: string; raw?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  if (error !== null && typeof error === "object") {
    try {
      return { raw: JSON.stringify(error) };
    } catch {
      return { raw: String(error) };
    }
  }
  return { raw: String(error) };
}

export function logError(error: unknown, context?: Record<string, unknown>): void {
  const serialized = serializeError(error);
  console.error("[ERROR]", {
    ...serialized,
    context,
  });
}
