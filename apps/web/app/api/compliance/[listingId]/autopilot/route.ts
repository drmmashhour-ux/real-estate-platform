import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import {
  getCriticalComplianceComplete,
  getMergedComplianceStatus,
} from "@/services/compliance/coownershipCompliance.service";

export const dynamic = "force-dynamic";

/** GET /api/compliance/:listingId/autopilot — compact summary for autopilot / monitoring */
export async function GET(_req: Request, ctx: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await ctx.params;
  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const merged = await getMergedComplianceStatus(listingId);
    const criticalOk = await getCriticalComplianceComplete(listingId);

    return NextResponse.json({
      listingId,
      applicable: merged.applies,
      criticalComplianceComplete: criticalOk,
      certificateComplete: merged.certificateComplete,
      insuranceGateComplete: merged.insuranceGateComplete,
      complianceReady: merged.complianceReady,
      overallPercent: merged.overallPercent ?? 0,
      blockingIssues: merged.blockingIssues ?? [],
      recommendation: merged.recommendation ?? "",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "Listing not found") return NextResponse.json({ error: msg }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
