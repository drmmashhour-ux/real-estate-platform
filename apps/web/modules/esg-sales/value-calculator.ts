/**
 * Illustrative dollar ranges for broker conversations — not an appraisal or MLV study.
 */

export type ValueUpliftEstimate = {
  illustrativeValueUpliftCad: number | null;
  /** Simple narrative basis */
  basis: string;
};

/**
 * Maps modeled score gap to a conservative % of declared value (cap 12%).
 */
export function estimateIllustrativeValueUpliftCad(args: {
  propertyValueMajor: number | null | undefined;
  currentScore: number;
  targetScore: number;
}): ValueUpliftEstimate {
  const v = args.propertyValueMajor;
  if (v == null || v <= 0) {
    return {
      illustrativeValueUpliftCad: null,
      basis: "No declared property value — cannot illustrate percentage-based uplift.",
    };
  }
  const gap = Math.max(0, Math.min(40, args.targetScore - args.currentScore));
  const pct = Math.min(0.12, (gap / 100) * 0.14);
  const cad = Math.round(v * pct);
  return {
    illustrativeValueUpliftCad: cad,
    basis: `Illustrative uplift uses a capped fraction of declared value vs modeled score gap (${gap.toFixed(0)} pts) — not an appraisal.`,
  };
}

export function formatCad(n: number): string {
  return `$${n.toLocaleString("en-CA")} CAD`;
}
