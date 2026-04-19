/**
 * Short natural-language summaries — max 5; uncertainty preserved; no ROI guarantees.
 */

import type { CapitalAllocationPlan } from "@/modules/growth/capital-allocation.types";

export function buildCapitalAllocationInsights(plan: Omit<CapitalAllocationPlan, "insights">): string[] {
  const out: string[] = [];
  const recs = [...plan.recommendations].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return a.target.localeCompare(b.target);
  });

  for (const r of recs) {
    if (out.length >= 5) break;
    const unc =
      r.confidence === "high"
        ? "Signals mostly align, but outcomes remain uncertain outside controlled experiments."
        : r.confidence === "medium"
          ? "Medium confidence — validate with additional logging before reallocating materially."
          : "Low confidence — exploratory guidance only.";

    if (r.bucket.id === "city_execution") {
      out.push(`Consider scaling operator attention in ${r.target} — logged execution blends look comparatively strong (${unc})`);
    } else if (r.bucket.id === "city_expansion") {
      out.push(`Expansion toward ${r.target} appears plausible on similarity/demand proxies (${unc})`);
    } else if (r.bucket.id === "conversion_optimization") {
      out.push(`${r.target} shows demand signals but weaker playbook progression vs peers — conversion work may help before paid scale (${unc})`);
    } else if (r.bucket.id === "broker_acquisition") {
      out.push(`Supply-side emphasis ${r.target.startsWith("system:") ? "(network-wide)" : `for ${r.target}`} — broker/listing density looks thin vs demand proxies (${unc})`);
    } else if (r.bucket.id === "hold") {
      out.push(`Hold emphasis on ${r.target} until attribution density improves (${unc})`);
    }
  }

  if (!out.length) {
    out.push("Insufficient structured signals — default to manual judgment and avoid inferring budget priorities from this panel.");
  }

  return out.slice(0, 5);
}
