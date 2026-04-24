import type { RecommendationRequestContext } from "@/modules/playbook-memory/types/playbook-memory.types";

/**
 * Listing search / intent context (price, location, intent). Never throws.
 */
export async function buildListingsContext(
  input: unknown,
): Promise<Record<string, string | number | boolean | null>> {
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
      priceMin: (s["priceMin"] as number) ?? (s["minPrice"] as number) ?? null,
      priceMax: (s["priceMax"] as number) ?? (s["maxPrice"] as number) ?? null,
      userIntent: String(s["intent"] ?? s["searchIntent"] ?? "browse"),
      city: m["city"] != null ? String(m["city"]) : null,
      neighborhood: m["neighborhood"] != null ? String(m["neighborhood"]) : null,
      propertyType: s["propertyType"] != null ? String(s["propertyType"]) : null,
      filters: s["filters"] != null ? String(JSON.stringify(s["filters"])) : null,
    };
  } catch {
    return {};
  }
}
