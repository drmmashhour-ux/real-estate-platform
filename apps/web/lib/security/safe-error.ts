/**
 * Return generic messages to clients in production; avoid leaking stack traces or internal ids.
 */
export function safeClientErrorMessage(_error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (process.env.NODE_ENV !== "production") {
    if (_error instanceof Error && _error.message.trim()) return _error.message;
  }
  return fallback;
}

/** Whether to include technical detail in JSON error responses (dev/staging only). */
export function includeErrorDetailInResponse(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";
}
