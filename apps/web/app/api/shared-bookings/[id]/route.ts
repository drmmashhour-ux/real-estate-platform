import { NextRequest } from "next/server";
import { getSharedBookingById } from "@/lib/shared-booking";

/**
 * GET /api/shared-bookings/[id] — Single shared booking.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await getSharedBookingById(id);
    if (!row) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(row);
  } catch (e) {
    console.error("GET /api/shared-bookings/[id]:", e);
    return Response.json(
      { error: "Failed to load shared booking" },
      { status: 500 }
    );
  }
}
