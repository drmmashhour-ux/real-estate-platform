/**
 * Normalize DocuSign Connect JSON payloads (structure varies by event).
 * Never infer signed without explicit recipient/completed events.
 */
export type NormalizedSignEvent =
  | { type: "envelope_sent"; envelopeId: string }
  | { type: "envelope_completed"; envelopeId: string }
  | { type: "recipient_completed"; envelopeId: string; recipientEmail?: string; recipientId?: string }
  | { type: "envelope_declined"; envelopeId: string; reason?: string }
  | { type: "unknown"; envelopeId?: string; raw: string };

export function parseDocuSignConnectPayload(body: unknown): NormalizedSignEvent[] {
  const out: NormalizedSignEvent[] = [];
  const data = body as Record<string, unknown>;
  const event = (data.event as string) ?? (data.Event as string);

  const envelopeId =
    (data.envelopeId as string) ??
    (data.envelopeSummary as { envelopeId?: string } | undefined)?.envelopeId ??
    (data.data as { envelopeId?: string } | undefined)?.envelopeId;

  if (event?.includes("sent") || event === "envelope-sent") {
    if (envelopeId) out.push({ type: "envelope_sent", envelopeId });
  }
  if (event?.includes("completed") && event?.includes("envelope")) {
    if (envelopeId) out.push({ type: "envelope_completed", envelopeId });
  }
  if (event?.includes("recipient-completed") || event === "recipient-completed") {
    const r = (data.data ?? data) as { recipientEmail?: string; recipientId?: string };
    if (envelopeId) {
      out.push({
        type: "recipient_completed",
        envelopeId,
        recipientEmail: r.recipientEmail,
        recipientId: r.recipientId,
      });
    }
  }
  if (event?.includes("declined")) {
    if (envelopeId) out.push({ type: "envelope_declined", envelopeId });
  }
  if (!out.length) {
    out.push({ type: "unknown", envelopeId, raw: JSON.stringify(body).slice(0, 2000) });
  }
  return out;
}
