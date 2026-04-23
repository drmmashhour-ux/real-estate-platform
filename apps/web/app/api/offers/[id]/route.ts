import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canViewOffer, resolveOfferActorRole } from "@/modules/offers/services/offer-access";
import { maskEmail } from "@/modules/offers/services/mask-email";
import {
  OFFER_MAX_CONDITIONS,
  OFFER_MAX_MESSAGE,
  parseOptionalClosingDate,
  parseOptionalString,
  parseOfferedPrice,
  parseScenario,
} from "@/modules/offers/services/offer-validation";
import { filterEventsForViewer } from "@/modules/offers/services/serialize-offer";
import { getListingById } from "@/lib/bnhub/listings";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "asc" } },
      buyer: { select: { name: true, email: true } },
    },
  });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

  if (!canViewOffer({ userId, role: user.role, offer })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const actor = resolveOfferActorRole({ userId, role: user.role, offer });
  const viewer = actor === "buyer" ? "buyer" : "broker";
  const events = filterEventsForViewer(offer.events, viewer);

  const listingRow = await getListingById(offer.listingId);
  const listingTitle = listingRow?.title ?? null;

  const payload = {
    ...offer,
    events,
    listingTitle,
    buyer:
      offer.buyerId === userId
        ? offer.buyer
        : {
            name: offer.buyer?.name ?? null,
            email: maskEmail(offer.buyer?.email),
          },
  };

  return NextResponse.json({ ok: true, offer: payload });
}

/** PATCH — buyer may edit only while DRAFT. */
export async function PATCH(request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.buyerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (offer.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft offers can be edited" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
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

  const updated = await prisma.offer.update({
    where: { id },
    data: {
      offeredPrice: price.value,
      downPaymentAmount: down ?? null,
      financingNeeded: financing ?? null,
      closingDate: closing.value,
      conditions: cond.value,
      message: msg.value,
      ...(scenario !== undefined ? { scenario } : {}),
    },
  });

  return NextResponse.json({ ok: true, offer: updated });
}
