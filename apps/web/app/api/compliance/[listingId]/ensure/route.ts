import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { ensureMergedCoOwnershipChecklist } from "@/services/compliance/coownershipCompliance.service";

export const dynamic = "force-dynamic";

/** POST /api/compliance/:listingId/ensure — materialize merged checklist rows (condo / co-ownership) */
export async function POST(_req: Request, ctx: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await ctx.params;
  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const result = await ensureMergedCoOwnershipChecklist(listingId);
    return NextResponse.json({ success: true, createdKeys: result.createdKeys });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "Listing not found") return NextResponse.json({ error: msg }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Ensure failed" }, { status: 500 });
  }
}
