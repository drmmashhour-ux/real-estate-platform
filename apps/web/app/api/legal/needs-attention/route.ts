import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { legalIntelligenceFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { getLegalIntelligenceSignals } from "@/modules/legal/legal-intelligence.service";
import { toUserSafeAttentionItems } from "@/modules/legal/legal-user-attention.mapper";

export const dynamic = "force-dynamic";

function safeId(raw: string | null): string | null {
  if (!raw || raw.length > 64) return null;
  if (!/^[^/?#]+$/.test(raw)) return null;
  return raw;
}

export async function GET(req: NextRequest) {
  try {
    const listingId = safeId(req.nextUrl.searchParams.get("listingId"));
    const userId = await getGuestId();

    if (!listingId || !userId) {
      return NextResponse.json({ items: [], flags: { enabled: legalIntelligenceFlags.legalIntelligenceV1 }, notice: null });
    }

    if (!legalIntelligenceFlags.legalIntelligenceV1) {
      return NextResponse.json({
        items: [],
        flags: { enabled: false },
        notice: null,
      });
    }

    const owns = await prisma.fsboListing.findFirst({
      where: { id: listingId, ownerId: userId },
      select: { id: true },
    });

    if (!owns) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const signals = await getLegalIntelligenceSignals({
      entityType: "fsbo_listing",
      entityId: listingId,
      actorType: "seller",
      workflowType: "fsbo_seller_documents",
    });

    let items = toUserSafeAttentionItems(signals);

    const rejectedSlots = await prisma.fsboListingDocument.count({
      where: { fsboListingId: listingId, status: "rejected" },
    });

    if (rejectedSlots > 0 && !items.some((i) => i.kind === "document_status")) {
      items = [
        {
          kind: "document_status",
          title: "Rejected document slot",
          detail:
            "At least one required document upload was rejected. Read the reviewer note and upload a corrected file.",
          suggestedNextStep: "Open document uploads from your FSBO checklist and replace the flagged file.",
        },
        ...items,
      ];
    }

    const missingSlots = await prisma.fsboListingDocument.count({
      where: { fsboListingId: listingId, docType: { in: ["ownership", "id_proof"] }, status: "missing" },
    });

    if (missingSlots > 0 && !items.some((i) => i.title.includes("Complete"))) {
      items.push({
        kind: "requirements",
        title: "Finish core identity proofs",
        detail:
          "Ownership or identity proof slots are still marked incomplete — listing verification may pause until provided.",
        suggestedNextStep: "Upload the ownership and identification documents requested in your checklist.",
      });
    }

    return NextResponse.json({
      items,
      flags: { enabled: true },
      notice: null,
    });
  } catch {
    return NextResponse.json({ items: [], flags: { enabled: legalIntelligenceFlags.legalIntelligenceV1 }, notice: null });
  }
}
