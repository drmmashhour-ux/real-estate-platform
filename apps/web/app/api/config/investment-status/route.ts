import { isInvestmentFeaturesEnabled } from "@/lib/compliance/investment-features";

export const dynamic = "force-dynamic";

/** Public boolean only — used to hide hub entries client-side; does not expose registration data. */
export async function GET() {
  const enabled = await isInvestmentFeaturesEnabled();
  return Response.json({ investmentEnabled: enabled });
}
