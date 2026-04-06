import {
  getInsurancePresentationHintForUser,
  insuranceLeadQualityTierFromViews,
} from "@/lib/insurance/insurance-optimal-moment";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

/**
 * GET — when to show insurance and lead-quality tier for dynamic merchandising.
 */
export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hint = await getInsurancePresentationHintForUser(user.id);
  const leadTier = insuranceLeadQualityTierFromViews(hint.listingViews7d);

  return Response.json({
    ...hint,
    leadQualityTier: leadTier,
  });
}
