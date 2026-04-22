/**
 * Structured prefixes for Senior Living AI — trace every decision without leaking PII to stdout in prod.
 */
export type SeniorAiLogChannel =
  | "[senior-ai]"
  | "[senior-intent]"
  | "[senior-match]"
  | "[senior-ranking]"
  | "[senior-lead-score]"
  | "[senior-conversion]"
  | "[senior-followup]"
  | "[senior-learning]"
  | "[senior-heatmap]"
  | "[senior-pricing]";

export function logSeniorAi(
  channel: SeniorAiLogChannel,
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
