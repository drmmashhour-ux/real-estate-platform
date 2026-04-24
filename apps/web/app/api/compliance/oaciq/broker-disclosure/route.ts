import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@repo/db";
import {
  MandatoryBrokerDisclosureError,
  getBrokerDisclosureStatusForDeal,
  mandatoryBrokerDisclosureEnforced,
  parseBrokerDisclosureRole,
  recordBrokerMandatoryDisclosure,
} from "@/lib/compliance/oaciq/broker-mandatory-disclosure.service";

export const dynamic = "force-dynamic";

/**
 * GET — disclosure status for a residential deal (buyer/seller/broker on deal, or admin).
 */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const dealId = req.nextUrl.searchParams.get("dealId");
  if (!dealId) return NextResponse.json({ error: "dealId required" }, { status: 400 });

  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
    select: { id: true },
  });
  const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!deal && viewer?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!deal && viewer?.role === PlatformRole.ADMIN) {
    const exists = await prisma.deal.findUnique({ where: { id: dealId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status = await getBrokerDisclosureStatusForDeal(dealId);
  return NextResponse.json({
    enforcementEnabled: mandatoryBrokerDisclosureEnforced(),
    ...status,
  });
}

/**
 * POST — broker (or admin) files mandatory OACIQ disclosure for a deal or listing scope.
 */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (viewer?.role !== PlatformRole.BROKER && viewer?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Broker or admin required" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const brokerId =
    viewer.role === PlatformRole.ADMIN && typeof body.brokerId === "string"
      ? body.brokerId
      : userId;

  const role = parseBrokerDisclosureRole(body.role);
  if (!role) return NextResponse.json({ error: "role must be BROKER | BUYER | SELLER | INVESTOR" }, { status: 400 });

  const dealId = typeof body.dealId === "string" ? body.dealId : null;
  const listingId = typeof body.listingId === "string" ? body.listingId : null;
  const fsboListingId = typeof body.fsboListingId === "string" ? body.fsboListingId : null;

  try {
    const row = await recordBrokerMandatoryDisclosure({
      brokerId,
      actorUserId: userId,
      role,
      dealId,
      listingId,
      fsboListingId,
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    if (e instanceof MandatoryBrokerDisclosureError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
