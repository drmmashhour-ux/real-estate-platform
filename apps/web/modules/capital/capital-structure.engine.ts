import type { CapitalStrategyType, StackEngineResult } from "@/modules/capital/capital.types";

/**
 * Deterministic capital stack hints from listing ask and strategy — no fabricated market pricing.
 */
export function buildCapitalStructurePreview(input: {
  listingPriceMajor: number | null;
  strategy: CapitalStrategyType;
}): StackEngineResult {
  const rationale: string[] = [];
  const warnings: string[] = [];
  const dataGaps: string[] = [];

  if (input.listingPriceMajor == null || !Number.isFinite(input.listingPriceMajor)) {
    dataGaps.push("No reliable total capital anchor (e.g. listing price / agreed value) — stack targets left blank.");
    warnings.push("Cannot infer leverage split without a stated capital requirement or agreed value.");
    return {
      totalCapitalRequired: null,
      seniorDebtTarget: null,
      mezzanineTarget: null,
      preferredEquityTarget: null,
      commonEquityTarget: null,
      rationale: [
        "Provide total capital required (or agreed transaction value) before numeric targets are proposed.",
      ],
      warnings,
      dataGaps,
    };
  }

  const total = input.listingPriceMajor;
  rationale.push(`Anchor: ${total.toLocaleString()} (major units) — treated as indicative total capital envelope, not an appraisal.`);

  let seniorPct = 0.65;
  let mezzPct = 0.05;
  let prefPct = 0.1;
  let commonPct = 0.2;

  if (input.strategy === "CONSERVATIVE") {
    seniorPct = 0.55;
    mezzPct = 0.05;
    prefPct = 0.15;
    commonPct = 0.25;
    warnings.push("Conservative profile: lower senior leverage — larger equity buffer.");
  } else if (input.strategy === "AGGRESSIVE") {
    seniorPct = 0.72;
    mezzPct = 0.08;
    prefPct = 0.05;
    commonPct = 0.15;
    warnings.push(
      "AGGRESSIVE: higher modeled leverage — lender appetite, LTV limits, and covenants must confirm feasibility (estimated split only)."
    );
  }

  const seniorDebtTarget = Math.round(total * seniorPct * 100) / 100;
  const mezzanineTarget = Math.round(total * mezzPct * 100) / 100;
  const preferredEquityTarget = Math.round(total * prefPct * 100) / 100;
  const commonEquityTarget = Math.round(total * commonPct * 100) / 100;

  rationale.push(
    `Illustrative split (${input.strategy}): senior ~${(seniorPct * 100).toFixed(0)}%, mezz ~${(mezzPct * 100).toFixed(0)}%, pref ~${(prefPct * 100).toFixed(0)}%, common ~${(commonPct * 100).toFixed(0)}% — **estimated**, subject to underwriting.`
  );

  warnings.push("All figures are directional bands for internal planning — not commitments from lenders or investors.");

  return {
    totalCapitalRequired: total,
    seniorDebtTarget,
    mezzanineTarget,
    preferredEquityTarget,
    commonEquityTarget,
    rationale,
    warnings,
    dataGaps,
  };
}
