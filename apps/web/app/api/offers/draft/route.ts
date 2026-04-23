import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { assertListingExists } from "@/modules/offers/services/listing-exists";
import {
  OFFER_MAX_CONDITIONS,
  OFFER_MAX_MESSAGE,
  parseOptionalClosingDate,
  parseOptionalString,
  parseOfferedPrice,
  parseScenario,
} from "@/modules/offers/services/offer-validation";
import { maybeBlockOfferForDeclaration } from "@/modules/offers/services/offer-declaration-gate";

export const dynamic = "force-dynamic";

/** POST /api/offers/draft — save draft (status DRAFT). */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const listingCheck = await assertListingExists(listingId);
  if (!listingCheck.ok) {
    return NextResponse.json({ error: listingCheck.error }, { status: listingCheck.status });
  }

  const declBlock = await maybeBlockOfferForDeclaration(listingId);
  if (declBlock) return declBlock;

  const price = parseOfferedPrice(body.offeredPrice);
  if (!price.ok) return NextResponse.json({ error: price.error }, { status: 400 });

  let down: number | null | undefined;
  if (body.downPaymentAmount != null && body.downPaymentAmount !== "") {
    const d = typeof body.downPaymentAmount === "number" ? body.downPaymentAmount : parseFloat(String(body.downPaymentAmount));
    if (!Number.isFinite(d) || d < 0) return NextResponse.json({ error: "downPaymentAmount is invalid" }, { status: 400 });
    down = d;
  }

  let financing: boolean | null | undefined;
  if (body.financingNeeded === true || body.financingNeeded === false) financing = body.financingNeeded;
  if (body.financingNeeded === "yes") financing = true;
  if (body.financingNeeded === "no") financing = false;

  const closing = await parseOptionalClosingDate(body.closingDate);
  if (!closing.ok) return NextResponse.json({ error: closing.error }, { status: 400 });

  const cond = parseOptionalString(body.conditions, OFFER_MAX_CONDITIONS, "conditions");
  if (!cond.ok) return NextResponse.json({ error: cond.error }, { status: 400 });
  const msg = parseOptionalString(body.message, OFFER_MAX_MESSAGE, "message");
  if (!msg.ok) return NextResponse.json({ error: msg.error }, { status: 400 });

  const scenario = parseScenario(body.scenario);

  const data: Prisma.OfferCreateInput = {
    listingId,
    buyer: { connect: { id: userId } },
    status: "DRAFT",
    offeredPrice: price.value,
    downPaymentAmount: down ?? null,
    financingNeeded: financing ?? null,
    closingDate: closing.value,
    conditions: cond.value,
    message: msg.value,
    ...(scenario !== undefined ? { scenario } : {}),
  };

  const offer = await prisma.$transaction(async (tx) => {
    const o = await tx.offer.create({ data });
    await tx.offerEvent.create({
      data: {
        offerId: o.id,
        actorId: userId,
        type: "CREATED",
        message: "Draft saved",
        metadata: { draft: true },
      },
    });
    return o;
  });

  return NextResponse.json({ ok: true, offer });
}
