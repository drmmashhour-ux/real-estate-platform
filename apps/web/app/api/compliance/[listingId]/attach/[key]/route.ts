import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { attachDocumentToChecklistItem } from "@/services/compliance/coownershipDocuments.service";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** POST /api/compliance/:listingId/attach/:key — link document to checklist row */
export async function POST(req: Request, ctx: { params: Promise<{ listingId: string; key: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId, key } = await ctx.params;
  const decodedKey = decodeURIComponent(key);
  
  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { documentId?: string } = {};
  try {
    body = (await req.json()) as { documentId?: string };
  } catch {
    body = {};
  }

  const { documentId } = body;
  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });

  try {
    const item = await prisma.checklistItem.findUnique({
      where: { listingId_key: { listingId, key: decodedKey } },
    });
    
    if (!item) {
      return NextResponse.json({ error: `Checklist item not found for key: ${decodedKey}` }, { status: 404 });
    }

    const updated = await attachDocumentToChecklistItem(item.id, documentId, userId);
    return NextResponse.json({ item: updated });
  } catch (e) {
    console.error("[api][compliance][attach]", e);
    return NextResponse.json({ error: "Failed to attach document" }, { status: 500 });
  }
}
