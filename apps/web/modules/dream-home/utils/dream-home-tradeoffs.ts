import type { DreamHomeQuestionnaireInput } from "../types/dream-home.types";

/**
 * Deterministic tradeoff lines from explicit declared preferences (no protected-trait inference).
 */
export function buildDreamHomeTradeoffs(q: DreamHomeQuestionnaireInput): string[] {
  const out: string[] = [];
  const commute = q.commutePriority;
  const budgetMax = q.budgetMax;
  const outdoor = q.outdoorPriority;
  const priv = q.privacyPreference;
  const host = q.hostingPreference;
  const city = (q.city ?? "").trim();
  const radius = q.radiusKm;

  if (commute === "high" && (outdoor === "high" || (q.lifestyleTags ?? []).some((t) => /yard|garden|outdoor/i.test(t)))) {
    out.push("A stronger commute focus often means trading some yard or low-density space for time-to-work — widen radius or reduce outdoor must-haves if results are thin.");
  }
  if (priv === "high" && budgetMax != null && budgetMax > 0) {
    out.push("High privacy in prime locations can compete with budget: consider slightly smaller footprint or a wider search area for separation.");
  }
  if (host === "high" && commute === "high") {
    out.push("Frequent hosting plus a tight commute can push toward larger floor plans in transit-rich nodes — you may need to flex budget or bedroom count.");
  }
  if (radius != null && radius < 5 && !city) {
    out.push("A very small radius without a specific city can limit inventory — add a city or increase radius (km) if you see few matches.");
  }
  if (q.transactionType === "rent" && (q.budgetMax == null || q.budgetMax <= 0)) {
    out.push("Rental search works best with an explicit monthly budget cap.");
  }
  if (out.length === 0) {
    out.push("Tradeoffs are personal: you can relax budget, location radius, or bedroom count — change one at a time to see how results shift.");
  }
  return out.slice(0, 6);
}
