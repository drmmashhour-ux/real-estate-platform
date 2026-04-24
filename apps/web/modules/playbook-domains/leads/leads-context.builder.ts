import type { RecommendationRequestContext } from "@/modules/playbook-memory/types/playbook-memory.types";

/**
 * CRM / inbound lead context (no PII; numeric + categorical only when provided). Never throws.
 */
export async function buildLeadsContext(input: unknown): Promise<Record<string, string | number | boolean | null>> {
  try {
    const c = input as Partial<RecommendationRequestContext>;
    if (!c || typeof c !== "object") {
      return {};
    }
    const seg = c.segment && typeof c.segment === "object" && !Array.isArray(c.segment) ? c.segment : {};
    const mkt = c.market && typeof c.market === "object" && !Array.isArray(c.market) ? c.market : {};
    const s = seg as Record<string, unknown>;
    const m = mkt as Record<string, unknown>;
    return {
      leadSource: s["source"] != null ? String(s["source"]) : null,
      pipelineStage: s["pipelineStage"] != null ? String(s["pipelineStage"]) : null,
      intent: s["intent"] != null ? String(s["intent"]) : "unknown",
      city: m["city"] != null ? String(m["city"]) : s["city"] != null ? String(s["city"]) : null,
      hasListing: Boolean(s["hasListing"] ?? s["listingId"]),
      channel: s["channel"] != null ? String(s["channel"]) : null,
    };
  } catch {
    return {};
  }
}
