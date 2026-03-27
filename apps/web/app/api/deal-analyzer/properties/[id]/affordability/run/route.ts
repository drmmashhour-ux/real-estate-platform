import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerMortgageModeEnabled } from "@/modules/deal-analyzer/config";
import { runMortgageAffordabilityAnalysis } from "@/modules/deal-analyzer/application/runMortgageAffordabilityAnalysis";
import { getMortgageAffordabilityDto } from "@/modules/deal-analyzer/application/getMortgageAffordability";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { runAffordabilityBodySchema } from "@/modules/deal-analyzer/api/phase3Schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerMortgageModeEnabled()) {
    return NextResponse.json({ error: "Affordability mode disabled" }, { status: 503 });
  }
  const { id } = await context.params;
  const userId = await getGuestId();
  const gate = await assertFsboListingAccessibleForPhase3(id, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = runAffordabilityBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const out = await runMortgageAffordabilityAnalysis({
    listingId: id,
    downPaymentCents: parsed.data.downPaymentCents,
    annualRate: parsed.data.annualRate,
    termYears: parsed.data.termYears,
    monthlyIncomeCents: parsed.data.monthlyIncomeCents,
    monthlyDebtsCents: parsed.data.monthlyDebtsCents,
  });
  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: 400 });
  }

  const dto = await getMortgageAffordabilityDto(id);
  return NextResponse.json({ affordability: dto, runId: out.id });
}
