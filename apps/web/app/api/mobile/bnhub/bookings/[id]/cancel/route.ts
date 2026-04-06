import { NextRequest, NextResponse } from "next/server";
import { cancelBooking, getBookingById } from "@/lib/bnhub/booking";
import { requireMobileGuestUser } from "@/lib/bnhub/mobile-api";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking || booking.guestId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const by = body?.by === "host" ? "host" : "guest";
    if (by !== "guest") {
      return NextResponse.json({ error: "Mobile guest cancel must be by guest" }, { status: 403 });
    }

    const updated = await cancelBooking(id, user.id, "guest");
    return NextResponse.json({
      booking: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel booking" },
      { status: 400 }
    );
  }
}
