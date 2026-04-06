import { BnhubBookingFunnelStage } from "@prisma/client";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function parseStage(raw: unknown): BnhubBookingFunnelStage | null {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  const all = Object.values(BnhubBookingFunnelStage) as string[];
  if (all.includes(s)) return s as BnhubBookingFunnelStage;
  return null;
}

/**
 * POST — booking funnel stages for analytics (pairs with Stripe webhooks).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    stage?: unknown;
    bookingId?: unknown;
    listingId?: unknown;
    amountCents?: unknown;
    anonymousId?: unknown;
    meta?: unknown;
  };

  const stage = parseStage(body.stage);
  if (!stage) {
    return Response.json({ error: "Invalid stage" }, { status: 400 });
  }

  const user = await getMobileAuthUser(request);
  const anonymousId =
    typeof body.anonymousId === "string" ? body.anonymousId.trim().slice(0, 64) : null;
  if (!user && !anonymousId) {
    return Response.json({ error: "Sign in or pass anonymousId" }, { status: 400 });
  }

  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim().slice(0, 80) : null;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim().slice(0, 80) : null;
  const amountCents =
    body.amountCents != null && Number.isFinite(Number(body.amountCents))
      ? Math.round(Number(body.amountCents))
      : null;

  await prisma.bnhubClientBookingFunnelEvent.create({
    data: {
      userId: user?.id ?? null,
      anonymousId,
      stage,
      supabaseBookingId: bookingId,
      supabaseListingId: listingId,
      amountCents,
      metaJson: body.meta && typeof body.meta === "object" ? body.meta : undefined,
    },
  });

  return Response.json({ ok: true });
}
