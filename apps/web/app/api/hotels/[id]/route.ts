import { NextRequest } from "next/server";
import { getHotelById } from "@/lib/hotel-hub";

/**
 * GET /api/hotels/[id] — Hotel detail with rooms.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hotel = await getHotelById(id);
    if (!hotel) {
      return Response.json({ error: "Hotel not found" }, { status: 404 });
    }
    return Response.json(hotel);
  } catch (e) {
    console.error("GET /api/hotels/[id]:", e);
    return Response.json({ error: "Failed to load hotel" }, { status: 500 });
  }
}
