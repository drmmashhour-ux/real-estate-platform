/** Structured JSON logs for serverless / Vercel log drains (no PII). */

export function logInfo(event: string, data?: unknown): void {
  console.log(JSON.stringify({ level: "info", event, data, at: new Date().toISOString() }));
}

export function logError(event: string, error: unknown): void {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      error: error instanceof Error ? error.message : String(error),
      at: new Date().toISOString(),
    }),
  );
}
