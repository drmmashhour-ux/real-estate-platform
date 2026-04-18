import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { bnhubV2Flags } from "@/config/feature-flags";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!bnhubV2Flags.bnhubAdminControlV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      status: {
        in: [
          BookingStatus.CONFIRMED,
          BookingStatus.PENDING,
          BookingStatus.AWAITING_HOST_APPROVAL,
          BookingStatus.DISPUTED,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      confirmationCode: true,
      status: true,
      checkIn: true,
      checkOut: true,
      totalCents: true,
      createdAt: true,
      listing: { select: { id: true, title: true, listingCode: true, city: true } },
      guest: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json({ bookings });
}
