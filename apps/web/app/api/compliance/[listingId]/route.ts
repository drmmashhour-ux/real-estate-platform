import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { getCachedComplianceStatus } from "@/lib/compliance/coownership-compliance-cache";
import { ensureCoOwnershipChecklist } from "@/services/compliance/coownershipCompliance.service";

export const dynamic = "force-dynamic";

/** GET /api/compliance/:listingId — checklist + completion flags */
export async function GET(_req: Request, ctx: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await ctx.params;
  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await ensureCoOwnershipChecklist(listingId);
    const status = await getCachedComplianceStatus(listingId);
    return NextResponse.json(status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "Listing not found") return NextResponse.json({ error: msg }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Failed to load compliance" }, { status: 500 });
  }
}
