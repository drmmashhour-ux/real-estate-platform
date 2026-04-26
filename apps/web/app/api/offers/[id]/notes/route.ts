import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { canViewOffer, isBrokerLikeRole } from "@/modules/offers/services/offer-access";
import { OFFER_MAX_NOTE, parseOptionalString } from "@/modules/offers/services/offer-validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST /api/offers/[id]/notes — broker/admin timeline note (optional internal). */
export async function POST(request: NextRequest, context: Params) {
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
  if (!isBrokerLikeRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (!canViewOffer({ userId, role: user.role, offer })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    message?: unknown;
    internal?: unknown;
    visibleToBuyer?: unknown;
  };
  const parsed = parseOptionalString(body.message, OFFER_MAX_NOTE, "message");
  if (!parsed.ok || !parsed.value) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const internal = body.internal === true;
  const visibleToBuyer = body.internal === false && body.visibleToBuyer === true;

  await prisma.offerEvent.create({
    data: {
      offerId: id,
      actorId: userId,
      type: "NOTE_ADDED",
      message: parsed.value,
      metadata: {
        internalNote: internal,
        visibleToBuyer: internal ? false : visibleToBuyer,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
