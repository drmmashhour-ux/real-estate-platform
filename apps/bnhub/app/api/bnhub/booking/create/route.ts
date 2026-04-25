import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createBooking } from "@/src/modules/bnhub/application/bookingService";
import { logInfo, logError } from "@/lib/logger";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    logInfo("[bnhub.booking.create.start]", { userId, listingId: body.listingId });
    
    const booking = await createBooking({
      listingId: String(body.listingId ?? ""),
      userId,
      startDate: String(body.startDate ?? ""),
      endDate: String(body.endDate ?? ""),
    });
    
    logInfo("[bnhub.booking.create.success]", { bookingId: booking.id, userId });
    return NextResponse.json({ booking });
  } catch (e) {
    logError("[bnhub.booking.create.error]", { error: e, userId });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

