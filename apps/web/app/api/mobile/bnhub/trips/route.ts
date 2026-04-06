import { NextResponse } from "next/server";
import { getBookingsForGuest } from "@/lib/bnhub/booking";
import { mapMobileTrip, requireMobileGuestUser } from "@/lib/bnhub/mobile-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await getBookingsForGuest(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    trips: bookings.map(mapMobileTrip),
  });
}
