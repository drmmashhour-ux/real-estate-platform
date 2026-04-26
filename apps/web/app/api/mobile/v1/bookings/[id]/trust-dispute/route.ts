import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  applyPayoutHoldForTrustDispute,
  recomputeGuestTrustMetrics,
} from "@/lib/bnhub/two-sided-trust-sync";
import { requireMobileUser } from "@/lib/mobile/mobileAuth";
import { resolvePrismaIdentitySubjectUserId } from "@/lib/mobile/resolvePrismaIdentitySubjectUserId";

export const dynamic = "force-dynamic";

/**
 * POST — guest or host opens a lightweight trust dispute (e.g. checklist mismatch).
 * Holds host payout until resolved (see `Payment.payoutHoldReason`).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireMobileUser(request);
    const prismaUserId = await resolvePrismaIdentitySubjectUserId(authUser);
    if (!prismaUserId) {
      return Response.json({ error: "Account not linked to platform user" }, { status: 409 });
    }
    const { id: bookingId } = await params;
    const body = (await request.json().catch(() => ({}))) as { message?: string };
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (message.length < 8) {
      return Response.json({ error: "message required (at least 8 characters)" }, { status: 400 });
    }
    if (message.length > 8000) {
      return Response.json({ error: "message too long" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [{ guestId: prismaUserId }, { listing: { ownerId: prismaUserId } }],
      },
      select: { id: true, guestId: true },
    });
    if (!booking) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const created = await prisma.bnhubTrustSimpleDispute.create({
      data: {
        bookingId,
        reporterId: prismaUserId,
        message,
        status: "OPEN",
      },
    });

    await applyPayoutHoldForTrustDispute(bookingId);
    void recomputeGuestTrustMetrics(booking.guestId).catch(() => {});

    return Response.json({ ok: true, id: created.id });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}
