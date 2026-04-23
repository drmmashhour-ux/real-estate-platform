import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { prisma } from "@repo/db";
import { userCanAccessCapitalModule, userCanMutateCapitalData, userCanSelectOfferAndFinalize } from "@/modules/capital/capital-access";
import { createFinancingOffer, selectFinancingOffer } from "@/modules/capital/financing-offers.service";
import { compareFinancingOffers } from "@/modules/capital/lender-comparison.engine";

export const dynamic = "force-dynamic";

const TAG = "[lender-offer]";

export async function GET(_request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanAccessCapitalModule(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const offers = await prisma.investmentPipelineFinancingOffer.findMany({
    where: { pipelineDealId: dealId },
    orderBy: { createdAt: "desc" },
  });

  const comparison = compareFinancingOffers(offers);

  return NextResponse.json({ offers, comparison });
}

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanMutateCapitalData(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.selectOfferId === "string") {
    if (!(await userCanSelectOfferAndFinalize(userId))) {
      logInfo(`${TAG}`, { denied: true, reason: "select offer", dealId });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
      await selectFinancingOffer({
        pipelineDealId: dealId,
        offerId: body.selectOfferId,
        actorUserId: userId,
        seedStandardConditions: body.seedStandardConditions !== false,
      });
      return NextResponse.json({ ok: true, selected: body.selectOfferId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Select failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  const offerName = typeof body.offerName === "string" ? body.offerName.trim() : "";
  if (!offerName) return NextResponse.json({ error: "offerName required" }, { status: 400 });

  try {
    const row = await createFinancingOffer({
      pipelineDealId: dealId,
      actorUserId: userId,
      offerName,
      lenderId: typeof body.lenderId === "string" ? body.lenderId : null,
      principalAmount: body.principalAmount != null ? Number(body.principalAmount) : null,
      interestType: typeof body.interestType === "string" ? body.interestType : null,
      interestRateText: typeof body.interestRateText === "string" ? body.interestRateText : null,
      amortizationText: typeof body.amortizationText === "string" ? body.amortizationText : null,
      termText: typeof body.termText === "string" ? body.termText : null,
      feesText: typeof body.feesText === "string" ? body.feesText : null,
      recourseType: typeof body.recourseType === "string" ? body.recourseType : null,
      covenantSummary: typeof body.covenantSummary === "string" ? body.covenantSummary : null,
      strengthsJson: body.strengthsJson,
      risksJson: body.risksJson,
      assumptionsJson: body.assumptionsJson,
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
