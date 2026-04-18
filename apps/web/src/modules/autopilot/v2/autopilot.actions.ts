import type { AutopilotV2ActionPayload, AutopilotV2Trigger } from "./autopilot.types";
import type { FsboSignalInput } from "./autopilot.rules";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Explainable suggestion payloads — never claims external market truth.
 */
export function buildSuggestionsFromTriggers(
  triggers: AutopilotV2Trigger[],
  s: FsboSignalInput,
): AutopilotV2ActionPayload[] {
  const items: AutopilotV2ActionPayload[] = [];

  for (const t of triggers) {
    if (t === "low_views_detected") {
      items.push({
        type: "improve_title",
        impactEstimate: 0.12,
        confidence: clamp01(0.56 + (s.titleLen < 20 ? 0.1 : 0)),
        explanation: [
          "Your listing has relatively few views for its age — internal signal only.",
          "A clearer title can improve clicks; we do not compare to external market demand.",
        ],
        suggestedChange: {
          hint: "Lead with property type + neighbourhood + beds; avoid all-caps.",
          currentTitleChars: s.titleLen,
        },
        autoApplicable: false,
      });
      items.push({
        type: "highlight_features",
        impactEstimate: 0.08,
        confidence: 0.5,
        explanation: [
          "Saved searches favour listings with structured amenities and clear differentiators.",
        ],
        suggestedChange: { focus: ["parking", "renovations", "outdoor space"] },
        autoApplicable: false,
      });
    }
    if (t === "low_conversion_detected") {
      items.push({
        type: "improve_description",
        impactEstimate: 0.09,
        confidence: 0.44,
        explanation: [
          "Views exist but saves are low — buyers may lack confidence from description depth.",
        ],
        suggestedChange: { minChars: 400, checklist: ["condition", "inclusions", "timeline"] },
        autoApplicable: false,
      });
    }
    if (t === "price_gap_detected") {
      items.push({
        type: "adjust_price",
        impactEstimate: 0.12,
        confidence: 0.38,
        explanation: [
          "Price updates can change ranking and alerts on our platform — confirm your strategy first.",
        ],
        suggestedChange: { note: "Review suggested band in Pricing Insight (not auto-applied)." },
        autoApplicable: false,
      });
    }
    if (t === "listing_updated") {
      if (s.imageCount < 4) {
        items.push({
          type: "add_missing_photos",
          impactEstimate: 0.18,
          confidence: 0.64,
          explanation: [
            "Photo count is below typical completed listings; exterior + kitchen + living room are high leverage.",
          ],
          suggestedChange: { minPhotos: 6, priorityRooms: ["exterior", "kitchen", "primary_bedroom"] },
          autoApplicable: false,
        });
      }
    }
  }

  const dedup = new Map<string, AutopilotV2ActionPayload>();
  for (const it of items) {
    dedup.set(it.type, it);
  }
  return [...dedup.values()];
}
