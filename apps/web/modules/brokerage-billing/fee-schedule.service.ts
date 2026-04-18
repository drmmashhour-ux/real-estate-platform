/** Fee schedule hints from office billing config JSON (v1 — display only). */
export function getFeeSchedulePreview(billingConfig: Record<string, unknown> | null): string[] {
  if (!billingConfig || typeof billingConfig !== "object") {
    return ["Configure `billingConfig` on office settings to surface scheduled fees."];
  }
  const keys = Object.keys(billingConfig);
  if (keys.length === 0) return ["No fee schedule entries in configuration."];
  return keys.map((k) => `${k}: ${JSON.stringify((billingConfig as Record<string, unknown>)[k])}`);
}
