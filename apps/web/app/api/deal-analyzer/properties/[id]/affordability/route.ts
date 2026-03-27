import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerMortgageModeEnabled } from "@/modules/deal-analyzer/config";
import { getMortgageAffordabilityDto } from "@/modules/deal-analyzer/application/getMortgageAffordability";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerMortgageModeEnabled()) {
    return NextResponse.json({ error: "Affordability mode disabled" }, { status: 503 });
  }
  const { id } = await context.params;
  const userId = await getGuestId();
  const gate = await assertFsboListingAccessibleForPhase3(id, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dto = await getMortgageAffordabilityDto(id);
  return NextResponse.json({ affordability: dto });
}
