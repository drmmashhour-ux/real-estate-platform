import "server-only";

export async function analyzeProjectInvestment(
  _project: unknown,
  _units: unknown[],
): Promise<{
  investmentScore?: number;
  shortExplanation?: string;
  expectedAppreciation?: number;
  rentalYieldEstimate?: number;
  riskLevel?: "low" | "medium" | "high";
} | null> {
  return null;
}
