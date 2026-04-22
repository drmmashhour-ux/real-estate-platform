/**
 * Part 16 — traceability for command, ops alerts, human overrides, and pricing/visibility optimization.
 */
export type SeniorCommandLogChannel =
  | "[senior-command]"
  | "[senior-alert]"
  | "[senior-override]"
  | "[senior-optimization]"
  | "[senior-expansion]";

export function logSeniorCommand(
  channel: SeniorCommandLogChannel,
  message: string,
  meta?: Record<string, string | number | boolean | null | undefined>,
): void {
  const safe =
    meta ?
      Object.fromEntries(
        Object.entries(meta).filter(([, v]) => v !== undefined && typeof v !== "object"),
      )
    : undefined;
  if (process.env.NODE_ENV === "development") {
    console.info(channel, message, safe ?? "");
  }
}
