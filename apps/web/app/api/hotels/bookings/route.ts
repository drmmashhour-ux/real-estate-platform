import { NextRequest } from "next/server";
import { createHotelBooking, getRoomById, isRoomAvailable } from "@/lib/hotel-hub";

/**
 * POST /api/hotels/bookings — Create a hotel booking.
 * Body: { roomId, guestName, checkIn, checkOut }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const roomId = typeof body.roomId === "string" ? body.roomId : null;
    const guestName = typeof body.guestName === "string" ? body.guestName.trim() : null;
    const checkInStr = typeof body.checkIn === "string" ? body.checkIn : null;
    const checkOutStr = typeof body.checkOut === "string" ? body.checkOut : null;

    if (!roomId || !guestName || !checkInStr || !checkOutStr) {
      return Response.json(
        { error: "roomId, guestName, checkIn, and checkOut are required" },
        { status: 400 }
      );
    }

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      return Response.json({ error: "Invalid dates" }, { status: 400 });
    }
    if (checkOut <= checkIn) {
      return Response.json({ error: "checkOut must be after checkIn" }, { status: 400 });
    }

    const room = await getRoomById(roomId);
    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    const available = await isRoomAvailable(roomId, checkIn, checkOut);
    if (!available) {
      return Response.json({ error: "Room not available for these dates" }, { status: 409 });
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000));
    const totalPrice = room.price * nights;

    const booking = await createHotelBooking({
      roomId,
      guestName,
      checkIn,
      checkOut,
      totalPrice,
    });

    return Response.json(booking, { status: 201 });
  } catch (e) {
    console.error("POST /api/hotels/bookings:", e);
    return Response.json({ error: "Booking failed" }, { status: 500 });
  }
}
