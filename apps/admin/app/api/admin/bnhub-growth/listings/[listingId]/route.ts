import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertGrowthAdmin, GrowthAuthError } from "@/src/modules/bnhub-growth-engine/services/growthAccess";
import { evaluateLaunchPolicy } from "@/src/modules/bnhub-growth-engine/policies/growthPolicyService";
import { listGrowthCampaigns } from "@/src/modules/bnhub-growth-engine/services/growthCampaignService";
import { listLeadsByListing } from "@/src/modules/bnhub-growth-engine/services/leadEngineService";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    await assertGrowthAdmin(await getGuestId());
    const { listingId } = await params;
    const [policy, campaigns, leads] = await Promise.all([
      evaluateLaunchPolicy(listingId),
      listGrowthCampaigns({ take: 50 }).then((rows) => rows.filter((c) => c.listingId === listingId)),
      listLeadsByListing(listingId),
    ]);
    return Response.json({ policy, campaigns, leads });
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
