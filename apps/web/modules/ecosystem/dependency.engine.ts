/**
 * Adoption depth — how deeply teams *choose* to embed the platform in their operating rhythm.
 * High scores must reflect delivered value; users should retain export, portability, and off-platform options.
 */

export type AdoptionDepthInput = {
  /** Count of distinct ecosystem layers with meaningful weekly usage (your rules). */
  activeLayersUsed: number;
  /** 0–1 share of seats using integrations or APIs actively. */
  integrationEngagementRate: number;
  /** 0–1 share of workflows that cross CRM ↔ marketplace ↔ intelligence in a typical week. */
  crossModuleWorkflowRate: number;
  /** Average sessions per active user per week (cap for stability). */
  weeklySessionsPerActiveUser: number;
  /** 0–1 proxy for data portability exercised (exports, sync) — healthy platforms score > 0. */
  dataPortabilityUsageRate: number;
};

export type AdoptionDepthResult = {
  /** 0–100: voluntary depth of usage — NOT lock-in or switching cost. */
  adoptionDepthScore: number;
  /** Plain-language interpretation for executives. */
  interpretation: string[];
  /** Concrete, ethical nudges — never "increase switching costs". */
  suggestions: string[];
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Score depth of value realization from voluntary usage signals.
 */
export function assessAdoptionDepth(input: AdoptionDepthInput): AdoptionDepthResult {
  const layers = clamp01((Math.max(0, input.activeLayersUsed) - 1) / 4); // 1–5 layers → 0–1
  const integ = clamp01(input.integrationEngagementRate);
  const cross = clamp01(input.crossModuleWorkflowRate);
  const sessions = clamp01(Math.min(14, Math.max(0, input.weeklySessionsPerActiveUser)) / 14);
  const portable = clamp01(input.dataPortabilityUsageRate);

  // Portability slightly increases score only to reward transparency, not to punish exports
  const adoptionDepthScore = Math.round(
    100 * (0.28 * layers + 0.22 * integ + 0.28 * cross + 0.12 * sessions + 0.1 * portable)
  );

  const interpretation: string[] = [
    "This score reflects *chosen* depth: broader layer usage, integrations, and cross-module workflows when users find them worthwhile.",
    "It explicitly rewards healthy portability signals — teams should always be able to move data responsibly.",
  ];

  if (adoptionDepthScore < 40) {
    interpretation.push("Depth is modest: focus on a narrow wedge with undeniable ROI before expanding surface area.");
  } else if (adoptionDepthScore < 65) {
    interpretation.push("Depth is developing: tighten onboarding between layers so value chains feel obvious, not mandatory.");
  } else {
    interpretation.push("Depth is high: guard against complexity creep; simplify paths for new seats and partners.");
  }

  const suggestions: string[] = [
    "Publish clear data export and API usage docs; depth should track transparency.",
    "Instrument cross-module journeys with funnels users recognize (CRM → deal → marketplace) to prove value.",
    "Review partner fairness: depth must not come from opaque exclusivity.",
  ];

  return { adoptionDepthScore, interpretation, suggestions };
}
