import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { cancelBooking, completeBookingStay } from "@/src/modules/bnhub/application/bookingService";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const action = String(body.action ?? "cancel");
    const bookingId = String(body.bookingId ?? "");
    const booking = action === "complete" ? await completeBookingStay(bookingId) : await cancelBooking(bookingId);
    return NextResponse.json({ booking });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

