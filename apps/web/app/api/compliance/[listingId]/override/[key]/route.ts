import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { overrideChecklistItemCompliance } from "@/services/compliance/coownershipCompliance.service";

export const dynamic = "force-dynamic";

/** POST /api/compliance/:listingId/override/:key — admin override compliance */
export async function POST(req: Request, ctx: { params: Promise<{ listingId: string; key: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  // TODO: Check if userId has ADMIN role. 
  // For now, we assume if they can access compliance they might have override power if allowed by system logic.
  // In a real app, use: if (!user.isAdmin) return forbidden.

  const { listingId, key } = await ctx.params;
  const decodedKey = decodeURIComponent(key);

  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { override?: boolean; reason?: string } = {};
  try {
    body = (await req.json()) as { override?: boolean; reason?: string };
  } catch {
    body = {};
  }

  const { override, reason } = body;
  if (override && !reason) {
    return NextResponse.json({ error: "Reason is required for override" }, { status: 400 });
  }

  try {
    const item = await overrideChecklistItemCompliance(
      listingId,
      decodedKey,
      override ?? true,
      reason ?? "No reason provided",
      userId
    );
    return NextResponse.json({ item });
  } catch (e) {
    console.error("[api][compliance][override]", e);
    return NextResponse.json({ error: "Failed to override checklist" }, { status: 500 });
  }
}
