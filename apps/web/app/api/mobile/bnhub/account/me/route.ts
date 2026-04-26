import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireMobileGuestUser } from "@/lib/bnhub/mobile-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unreadReservationNotifications = await prisma.notification.count({
    where: {
      userId: user.id,
      actionUrl: { startsWith: "/bnhub/booking/" },
      status: "UNREAD",
    },
  });

  return NextResponse.json({
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      homeCity: user.homeCity,
      homeRegion: user.homeRegion,
      homeCountry: user.homeCountry,
      createdAt: user.createdAt.toISOString(),
      unreadReservationNotifications,
    },
  });
}
