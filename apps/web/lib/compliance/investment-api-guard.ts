import { isInvestmentFeaturesEnabled } from "./investment-features";

export async function investmentFeaturesOr403(): Promise<Response | null> {
  if (!(await isInvestmentFeaturesEnabled())) {
    return Response.json(
      {
        error: "Investment features are disabled",
        code: "INVESTMENT_DISABLED",
        notice: "Investment-related features may require AMF compliance before enabling.",
      },
      { status: 403 }
    );
  }
  return null;
}
