/**
 * Safe message for DB / API (no stacks, no API key patterns).
 */
export function sanitizeMarketingError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Publish failed";
  return raw
    .replace(/sk-[a-zA-Z0-9]{10,}/g, "[redacted]")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]")
    .replace(/api[_-]?key["\s:=]+[^\s"']+/gi, "[redacted]")
    .slice(0, 500);
}
