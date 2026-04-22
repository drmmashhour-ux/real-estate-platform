/**
 * Part 11 — full traceability for autonomy (dev console; pipe to observability in prod).
 */
export type SeniorAutonomousLogChannel =
  | "[senior-autonomous]"
  | "[action-created]"
  | "[action-approved]"
  | "[action-executed]"
  | "[action-rejected]"
  | "[action-rolled-back]";

export function logSeniorAutonomous(
  channel: SeniorAutonomousLogChannel,
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
