/**
 * Execution priority engine — top 5 platform priorities (deterministic).
 */

import type {
  PlatformClarityReviewResult,
  PlatformDataMoatReviewResult,
  PlatformImprovementPriority,
  PlatformMonetizationReviewResult,
  PlatformOpsReviewResult,
  PlatformTrustReviewResult,
} from "./platform-improvement.types";
import type { PlatformReviewSnapshot } from "./platform-review-snapshot";
import { getDefaultPlatformReviewSnapshot } from "./platform-review-snapshot";

function scoreUrgency(u: PlatformImprovementPriority["urgency"]): number {
  return u === "high" ? 3 : u === "medium" ? 2 : 1;
}

function scoreCategory(c: PlatformImprovementPriority["category"]): number {
  return c === "revenue" ? 5 : c === "conversion" ? 4 : c === "trust" ? 3 : c === "data" ? 2 : 1;
}

function rank(p: PlatformImprovementPriority): number {
  return scoreUrgency(p.urgency) * 10 + scoreCategory(p.category);
}

export function buildPlatformImprovementPriorities(input: {
  clarity: PlatformClarityReviewResult;
  monetization: PlatformMonetizationReviewResult;
  trust: PlatformTrustReviewResult;
  ops: PlatformOpsReviewResult;
  dataMoat: PlatformDataMoatReviewResult;
  snapshot?: PlatformReviewSnapshot;
}): PlatformImprovementPriority[] {
  const snap = input.snapshot ?? getDefaultPlatformReviewSnapshot();
  const out: PlatformImprovementPriority[] = [];

  for (const gap of input.monetization.highPriorityMonetizationGaps.slice(0, 3)) {
    out.push({
      title: "Monetization alignment",
      why: gap,
      expectedImpact: "Clearer paid paths and less revenue leakage",
      category: "revenue",
      urgency: "high",
    });
  }

  for (const g of input.trust.coverageGaps.slice(0, 2)) {
    out.push({
      title: `Trust pattern: ${g.patternId}`,
      why: g.gap,
      expectedImpact: "Higher conversion on listing and checkout surfaces",
      category: "trust",
      urgency: snap.trustIndicatorsV1 ? "medium" : "high",
    });
  }

  if (input.ops.duplicatePanels.length > 0) {
    out.push({
      title: "Reduce duplicate operating panels",
      why: input.ops.duplicatePanels[0] ?? "Multiple dashboards echo the same metrics.",
      expectedImpact: "Faster operator decisions and fewer conflicting narratives",
      category: "ops",
      urgency: "medium",
    });
  }

  if (input.ops.missingShortcuts.length > 0) {
    out.push({
      title: "Add missing operator shortcuts",
      why: input.ops.missingShortcuts[0] ?? "",
      expectedImpact: "Less time hunting links during incidents",
      category: "ops",
      urgency: "medium",
    });
  }

  for (const m of input.dataMoat.missingHighValueSignals.slice(0, 2)) {
    out.push({
      title: "Data moat: capture missing signal",
      why: m,
      expectedImpact: "Stronger defensibility and pricing intelligence",
      category: "data",
      urgency: "low",
    });
  }

  const clarityFriction = input.clarity.surfaces.flatMap((s) => s.frictionRisks).slice(0, 1);
  if (clarityFriction.length > 0) {
    out.push({
      title: "Clarify primary CTA on key surfaces",
      why: clarityFriction[0]!,
      expectedImpact: "Better first-session conversion",
      category: "conversion",
      urgency: "medium",
    });
  }

  if (!snap.recommendationsV1) {
    out.push({
      title: "Conversion: recommendations off",
      why: "Recommendations v1 off — listing affinity may rely on generic browse.",
      expectedImpact: "Higher engagement when enabled",
      category: "conversion",
      urgency: "low",
    });
  }

  const seen = new Set<string>();
  const deduped: PlatformImprovementPriority[] = [];
  for (const p of out.sort((a, b) => rank(b) - rank(a))) {
    const k = `${p.category}:${p.title}:${p.why.slice(0, 40)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(p);
    if (deduped.length >= 5) break;
  }

  return deduped.slice(0, 5);
}
