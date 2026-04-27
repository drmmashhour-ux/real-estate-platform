/**
 * HITL — extend with Slack/webhook; never throws.
 */
export function sendAlert(message: string, meta?: Record<string, unknown>): void {
  const tail = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  console.warn(`[ALERT] ${message}${tail}`);
}
