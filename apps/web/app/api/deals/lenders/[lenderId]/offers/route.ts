import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { canManageCapital } from "@/modules/capital/capital-policy";
import { addOffer } from "@/modules/capital/lender-offer.service";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ lenderId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { lenderId } = await context.params;

  try {
    const lender = await prisma.lecipmPipelineDealLender.findUnique({ where: { id: lenderId } });
    if (!lender) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: lender.dealId } });
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal) || !canManageCapital(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const offeredAmount = typeof body.offeredAmount === "number" ? body.offeredAmount : NaN;
    const interestRate = typeof body.interestRate === "number" ? body.interestRate : NaN;
    if (!Number.isFinite(offeredAmount) || !Number.isFinite(interestRate)) {
      return NextResponse.json({ error: "offeredAmount and interestRate required" }, { status: 400 });
    }

    const conditionsJson =
      body.conditionsJson !== undefined ? (body.conditionsJson as Prisma.InputJsonValue) : undefined;

    const offer = await addOffer(
      lender.dealId,
      lenderId,
      {
        offeredAmount,
        interestRate,
        amortizationYears: typeof body.amortizationYears === "number" ? body.amortizationYears : undefined,
        termYears: typeof body.termYears === "number" ? body.termYears : undefined,
        conditionsJson,
      },
      auth.userId
    );

    return NextResponse.json({ offer });
  } catch (e) {
    logError("[api.deals.lenders.offers.post]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
