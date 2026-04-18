import type { LegalSourceAttribution } from "./legal-knowledge.types";
import { BROKER_REVIEW_LABEL } from "./legal-knowledge.types";

/** UI-safe single line for cards (no raw statute dump). */
export function formatAttributionLine(a: LegalSourceAttribution): string {
  const page = a.page != null ? `p. ${a.page}` : "n.p.";
  return `Based on ${a.source} (${page} – ${a.section}) — ${a.explanation}`;
}

export function withBrokerReviewNotice(a: LegalSourceAttribution): { attribution: LegalSourceAttribution; notice: typeof BROKER_REVIEW_LABEL } {
  return { attribution: a, notice: BROKER_REVIEW_LABEL };
}
