import { BookingStatus } from "@prisma/client";

import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/trust-summary — verification + coarse trust score for UI (requires session).
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.user.id;

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      phone: true,
    },
  });
  if (!u) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const completedStays = await prisma.booking.count({
    where: {
      guestId: userId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
    },
  });

  const emailOk = u.emailVerifiedAt != null;
  const phoneOk = Boolean(u.phone?.trim()) && u.phoneVerifiedAt != null;
  const verified = emailOk && phoneOk;
  const trustScore = completedStays * 10 + (verified ? 20 : 0);

  return Response.json({
    verified,
    emailVerified: emailOk,
    phoneVerified: phoneOk,
    completedBookings: completedStays,
    trustScore,
  });
}
