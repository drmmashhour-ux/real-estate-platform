import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerPricingAdvisorEnabled } from "@/modules/deal-analyzer/config";
import { runSellerPricingAdvisor } from "@/modules/deal-analyzer/application/runSellerPricingAdvisor";
import { getSellerPricingAdvisorDto } from "@/modules/deal-analyzer/application/getSellerPricingAdvisor";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerPricingAdvisorEnabled()) {
    return NextResponse.json({ error: "Pricing advisor disabled" }, { status: 503 });
  }
  const { id } = await context.params;
  const userId = await getGuestId();
  const gate = await assertFsboListingAccessibleForPhase3(id, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const out = await runSellerPricingAdvisor({ listingId: id });
  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: 400 });
  }

  const dto = await getSellerPricingAdvisorDto(id);
  return NextResponse.json({ pricingAdvisor: dto, runId: out.id });
}
