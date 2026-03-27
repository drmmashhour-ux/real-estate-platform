import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertMarketingAdmin, MarketingAuthError } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { createDistributionPlan } from "@/src/modules/bnhub-marketing/services/distributionService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertMarketingAdmin(await getGuestId());
    const { id } = await params;
    const body = (await request.json()) as { channelCodes: string[] };
    const rows = await createDistributionPlan(id, body.channelCodes ?? []);
    return Response.json({ distributions: rows });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 400 });
  }
}
