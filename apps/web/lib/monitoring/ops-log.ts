/**
 * Single-line JSON logs for correlating E2E failures, admin ops, and server paths.
 * Safe in production (no PII beyond IDs you pass explicitly).
 */
export function logOpsCorrelation(payload: Record<string, unknown>): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    channel: "lecipm_ops",
    ...payload,
  });
  console.log(line);
}
