import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { setChecklistItemCompleted } from "@/services/compliance/coownershipCompliance.service";

export const dynamic = "force-dynamic";

/** POST /api/compliance/:listingId/check/:key — mark checklist row completed */
export async function POST(_req: Request, ctx: { params: Promise<{ listingId: string; key: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId, key } = await ctx.params;
  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const item = await setChecklistItemCompleted(listingId, decodeURIComponent(key));
    return NextResponse.json({ item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "Listing not found") return NextResponse.json({ error: msg }, { status: 404 });
    if (msg.includes("does not apply") || msg.includes("Unknown checklist")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}
