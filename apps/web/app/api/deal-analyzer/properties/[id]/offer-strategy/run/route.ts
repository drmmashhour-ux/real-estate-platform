import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerOfferAssistantEnabled } from "@/modules/deal-analyzer/config";
import { runOfferStrategy } from "@/modules/deal-analyzer/application/runOfferStrategy";
import { getOfferStrategyDto } from "@/modules/deal-analyzer/application/getOfferStrategy";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { runOfferStrategyBodySchema } from "@/modules/deal-analyzer/api/phase3Schemas";
import type { UserStrategyMode } from "@/modules/deal-analyzer/domain/strategyModes";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerOfferAssistantEnabled()) {
    return NextResponse.json({ error: "Offer strategy disabled" }, { status: 503 });
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
  const parsed = runOfferStrategyBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const out = await runOfferStrategy({
    listingId: id,
    strategyMode: parsed.data.strategyMode as UserStrategyMode | null | undefined,
  });
  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: 400 });
  }

  const dto = await getOfferStrategyDto(id);
  return NextResponse.json({ offerStrategy: dto, runId: out.id });
}
