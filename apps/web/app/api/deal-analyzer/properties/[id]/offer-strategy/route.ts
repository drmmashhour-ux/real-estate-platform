import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerOfferAssistantEnabled } from "@/modules/deal-analyzer/config";
import { getOfferStrategyDto } from "@/modules/deal-analyzer/application/getOfferStrategy";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerOfferAssistantEnabled()) {
    return NextResponse.json({ error: "Offer strategy disabled" }, { status: 503 });
  }
  const { id } = await context.params;
  const userId = await getGuestId();
  const gate = await assertFsboListingAccessibleForPhase3(id, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dto = await getOfferStrategyDto(id);
  return NextResponse.json({ offerStrategy: dto });
}
