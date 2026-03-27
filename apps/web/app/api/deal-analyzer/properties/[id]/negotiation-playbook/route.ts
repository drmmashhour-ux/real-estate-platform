import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerNegotiationPlaybooksEnabled } from "@/modules/deal-analyzer/config";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { prisma } from "@/lib/db";
import { mapNegotiationPlaybookRow } from "@/modules/deal-analyzer/infrastructure/mappers/phase4DtoMappers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerNegotiationPlaybooksEnabled()) {
    return NextResponse.json({ error: "Negotiation playbooks disabled" }, { status: 503 });
  }
  const { id } = await context.params;
  const userId = await getGuestId();
  const gate = await assertFsboListingAccessibleForPhase3(id, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.dealNegotiationPlaybook.findFirst({
    where: { propertyId: id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ negotiationPlaybook: row ? mapNegotiationPlaybookRow(row) : null });
}
