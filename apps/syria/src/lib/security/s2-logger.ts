type S2Event =
  | "s2_rate_limited"
  | "s2_validation_failed"
  | "s2_admin_denied"
  | "s2_suspicious"
  | "s2_middleware_deny";

export function s2Log(
  event: S2Event,
  detail: Record<string, string | number | undefined> & { path?: string; ip?: string; retryAfter?: number },
) {
  const line = { ts: new Date().toISOString(), event, ...detail };
  try {
    console.warn(JSON.stringify(line));
  } catch {
    // ignore
  }
}
