import { NextResponse } from "next/server";
import type { ComplianceChecklistItemStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { setChecklistItemStatus } from "@/services/compliance/coownershipCompliance.service";

export const dynamic = "force-dynamic";

const STATUSES = new Set<ComplianceChecklistItemStatus>(["PENDING", "COMPLETED", "NOT_APPLICABLE"]);

/** POST /api/compliance/:listingId/check/:key — update checklist row status */
export async function POST(req: Request, ctx: { params: Promise<{ listingId: string; key: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId, key } = await ctx.params;
  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { status?: ComplianceChecklistItemStatus } = {};
  try {
    body = (await req.json()) as { status?: ComplianceChecklistItemStatus };
  } catch {
    body = {};
  }

  const status: ComplianceChecklistItemStatus = body.status ?? "COMPLETED";
  if (!STATUSES.has(status)) {
    return NextResponse.json({ error: "status must be PENDING, COMPLETED, or NOT_APPLICABLE" }, { status: 400 });
  }

  try {
    const item = await setChecklistItemStatus(listingId, decodeURIComponent(key), status, userId);
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
