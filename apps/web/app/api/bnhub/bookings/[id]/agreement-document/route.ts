import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { generateBookingAgreement } from "@/src/modules/bnhub/application/bookingAgreementDocumentService";

export const dynamic = "force-dynamic";

async function assertParty(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true, listing: { select: { ownerId: true } } },
  });
  if (!booking) return { ok: false as const, status: 404 as const };
  if (booking.guestId !== userId && booking.listing.ownerId !== userId) {
    return { ok: false as const, status: 403 as const };
  }
  return { ok: true as const };
}

/** GET latest stored markdown snapshot. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id: bookingId } = await context.params;
  const gate = await assertParty(bookingId, userId);
  if (!gate.ok) return Response.json({ error: "Forbidden" }, { status: gate.status });

  const latest = await prisma.bnhubBookingAgreementSnapshot.findFirst({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return Response.json({ contentMarkdown: null });
  return Response.json({
    id: latest.id,
    contentMarkdown: latest.contentMarkdown,
    documentUrl: latest.documentUrl,
    createdAt: latest.createdAt.toISOString(),
  });
}

/** POST — generate & store bnhub_booking_agreements snapshot (guest or host on booking). */
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id: bookingId } = await context.params;
  const gate = await assertParty(bookingId, userId);
  if (!gate.ok) return Response.json({ error: gate.status === 404 ? "Not found" : "Forbidden" }, { status: gate.status });

  try {
    const doc = await generateBookingAgreement(bookingId);
    return Response.json(doc);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
