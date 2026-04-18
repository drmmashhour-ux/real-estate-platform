/** Structured logs for host conversion — safe for production log drains (no PII in message). */
export function logHostFunnelEvent(
  event: string,
  payload: Record<string, string | number | boolean | null | undefined> = {},
) {
  console.info(
    JSON.stringify({
      layer: "host_conversion",
      event,
      ...payload,
      t: new Date().toISOString(),
    }),
  );
}
