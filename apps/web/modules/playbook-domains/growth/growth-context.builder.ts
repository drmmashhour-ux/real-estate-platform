import type { RecommendationRequestContext } from "@/modules/playbook-memory/types/playbook-memory.types";

/**
 * Lightweight funnel / acquisition context. Never throws.
 */
export async function buildGrowthContext(
  input: unknown,
): Promise<Record<string, string | number | boolean | null>> {
  try {
    const c = input as Partial<RecommendationRequestContext>;
    if (!c || typeof c !== "object") {
      return {};
    }
    const seg = c.segment && typeof c.segment === "object" && !Array.isArray(c.segment) ? c.segment : {};
    const sig = c.signals && typeof c.signals === "object" && !Array.isArray(c.signals) ? c.signals : {};
    return {
      funnelStage: String((seg as Record<string, unknown>)["funnelStage"] ?? (seg as Record<string, unknown>)["urgency"] ?? "unknown"),
      source: String((seg as Record<string, unknown>)["source"] ?? (sig as Record<string, unknown>)["utm_source"] ?? "organic"),
      device: String((sig as Record<string, unknown>)["device"] ?? (sig as Record<string, unknown>)["deviceType"] ?? "unknown"),
    };
  } catch {
    return {};
  }
}
