import { formatCad } from "./value-calculator";

export type PitchPack = {
  sellerPitch: string;
  buyerPitch: string;
  shortSummary: string;
  roiBullets: string[];
};

export function buildPitchPack(args: {
  propertyLabel: string;
  city?: string | null;
  aiScore: number;
  estimatedGrantCad: number;
  illustrativeValueUpliftCad: number | null;
  grantDisclaimer: string;
  operatingCostNote?: string;
}): PitchPack {
  const loc = args.city?.trim() ? ` in ${args.city.trim()}` : "";
  const grantLine =
    args.estimatedGrantCad > 0
      ? `Programs aligned with retrofits may offer illustrative incentives around ${formatCad(args.estimatedGrantCad)} total — ${args.grantDisclaimer.toLowerCase()}`
      : "Illustrative incentives depend on approved measures — confirm with official portals.";

  const valueLine =
    args.illustrativeValueUpliftCad != null && args.illustrativeValueUpliftCad > 0
      ? `Based on declared value and modeled efficiency headroom, an illustrative equity story could cite up to ${formatCad(args.illustrativeValueUpliftCad)} — not a listing price recommendation.`
      : "Quantified value uplift needs a declared property value — gather client budget/value context first.";

  const sellerPitch = [
    `${args.propertyLabel}${loc} shows a modeled LECIPM green score of ${args.aiScore}/100 — a credible upgrade narrative can combine envelope, HVAC, and incentive stacking.`,
    valueLine,
    grantLine,
    "Position documented evaluations and RBQ-scope work to reduce buyer objections on operating costs.",
    "This wording supports conversations only — pricing strategy remains between you and your client.",
  ].join(" ");

  const buyerPitch = [
    `This home${loc} presents ${args.aiScore >= 62 ? "strong" : "meaningful"} modeled efficiency signals (${args.aiScore}/100).`,
    args.operatingCostNote ??
      "Completed upgrades typically reduce heating/cooling intensity versus legacy shells — validate with bills where permitted.",
    "Ask your broker how incentives were used during renovations so you understand net improvement scope.",
  ].join(" ");

  const shortSummary = [
    "This property has credible potential as a higher-efficiency home.",
    args.estimatedGrantCad > 0
      ? `Illustrative incentives could reach ${formatCad(args.estimatedGrantCad)} depending on approved measures.`
      : "Incentive eligibility depends on official approvals.",
    args.illustrativeValueUpliftCad != null && args.illustrativeValueUpliftCad > 0
      ? `Equity narratives sometimes reference illustrative uplifts near ${formatCad(args.illustrativeValueUpliftCad)} — confirm with comps.`
      : "Anchor pricing with comps and inspections — not modeled scores alone.",
  ].join(" ");

  const roiBullets = [
    args.illustrativeValueUpliftCad != null
      ? `Illustrative value storyline: up to ${formatCad(args.illustrativeValueUpliftCad)} vs declared value (modeled).`
      : "Illustrative value uplift: add declared property value to quantify.",
    `Illustrative incentive midpoint total: ${formatCad(args.estimatedGrantCad)}.`,
    `LECIPM modeled score: ${args.aiScore}/100.`,
  ];

  return { sellerPitch, buyerPitch, shortSummary, roiBullets };
}
