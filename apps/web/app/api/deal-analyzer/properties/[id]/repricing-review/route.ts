import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerRepricingTriggersEnabled } from "@/modules/deal-analyzer/config";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { mapRepricingReviewRow } from "@/modules/deal-analyzer/infrastructure/mappers/phase4DtoMappers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerRepricingTriggersEnabled()) {
    return NextResponse.json({ error: "Repricing review disabled" }, { status: 503 });
  }
  const { id } = await context.params;
  const userId = await getGuestId();
  const gate = await assertFsboListingAccessibleForPhase3(id, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.sellerRepricingReview.findUnique({ where: { propertyId: id } });
  return NextResponse.json({ repricingReview: row ? mapRepricingReviewRow(row) : null });
}
