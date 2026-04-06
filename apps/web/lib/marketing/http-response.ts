/**
 * Consistent JSON for marketing / AI admin APIs.
 * Success: `{ ok: true, ... }` — Errors: `{ ok: false, error: string, code?: string }`
 */
export function marketingJsonError(
  status: number,
  message: string,
  code?: string
): Response {
  return Response.json(
    { ok: false as const, error: message, ...(code ? { code } : {}) },
    { status }
  );
}

export function marketingJsonOk<T extends Record<string, unknown>>(data: T): Response {
  return Response.json({ ok: true as const, ...data });
}
