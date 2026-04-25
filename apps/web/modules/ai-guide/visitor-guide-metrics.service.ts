import { recordFunnelEvent } from "@/modules/growth/funnel-tracking.service";

const PATH = "/api/ai/visitor-guide";

export type VisitorGuideAnalyticsKind =
  | "message_sent"
  | "response_ok"
  | "cta_click"
  | "quick_question"
  | "signup_nav";

/**
 * Funnel events for guide engagement → CTA → signup. No PII in meta beyond optional sessionId.
 */
export async function recordVisitorGuideAnalytics(input: {
  kind: VisitorGuideAnalyticsKind;
  surface: "landing" | "dashboard";
  sessionId?: string | null;
  extra?: Record<string, unknown>;
}) {
  const isConversion = input.kind === "cta_click" || input.kind === "signup_nav";
  await recordFunnelEvent({
    category: isConversion ? "CONVERSION" : "ACTIVATION",
    path: PATH,
    sessionId: input.sessionId ?? null,
    metaJson: {
      visitorGuide: true,
      kind: input.kind,
      surface: input.surface,
      ...input.extra,
    },
  });
}

export function questionFingerprint(text: string, max = 64): string {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  return t.length <= max ? t : t.slice(0, max);
}
