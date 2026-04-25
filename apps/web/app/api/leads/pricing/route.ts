import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLeadPricingForBroker } from "@/modules/monetization/pricing-psychology.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    const pricing = await getLeadPricingForBroker(userId, leadId);
    return NextResponse.json(pricing);
  } catch (error) {
    console.error("[api][leads][pricing] Error:", error);
    return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 });
  }
}
