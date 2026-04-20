import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import {
  ensureMergedCoOwnershipChecklist,
  getMergedComplianceChecklist,
  getMergedComplianceStatus,
} from "@/services/compliance/coownershipCompliance.service";

export const dynamic = "force-dynamic";

/** GET /api/compliance/:listingId — merged checklist + completion + legacy fields */
export async function GET(_req: Request, ctx: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await ctx.params;
  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await ensureMergedCoOwnershipChecklist(listingId);
    const merged = await getMergedComplianceStatus(listingId);
    const grouped = await getMergedComplianceChecklist(listingId);

    return NextResponse.json({
      listingId,
      applicable: merged.applies,
      categories: grouped
        ? {
            coownership: { items: grouped.coownership.items, percent: grouped.coownership.percent },
            insurance: { items: grouped.insurance.items, percent: grouped.insurance.percent },
          }
        : null,
      coownershipPercent: merged.coownershipPercent ?? 0,
      insurancePercent: merged.insurancePercent ?? 0,
      overallPercent: merged.overallPercent ?? 0,
      blockingIssues: merged.blockingIssues ?? [],
      warnings: merged.warnings ?? [],
      recommendation: merged.recommendation ?? "",
      applies: merged.applies,
      listingType: merged.listingType,
      isCoOwnership: merged.isCoOwnership,
      items: merged.items,
      complete: merged.complete,
      certificateComplete: merged.certificateComplete,
      insuranceGateComplete: merged.insuranceGateComplete,
      complianceReady: merged.complianceReady,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "Listing not found") return NextResponse.json({ error: msg }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Failed to load compliance" }, { status: 500 });
  }
}
