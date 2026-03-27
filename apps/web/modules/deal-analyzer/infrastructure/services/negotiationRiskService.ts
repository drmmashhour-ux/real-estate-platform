/** Rules-based negotiation difficulty — not a credit or legal assessment. */
export function negotiationRiskLevel(args: { trustScore: number | null; riskScore: number }): "low" | "medium" | "high" {
  const t = args.trustScore ?? 45;
  if (args.riskScore >= 70 || t < 38) return "high";
  if (args.riskScore >= 52 || t < 52) return "medium";
  return "low";
}
