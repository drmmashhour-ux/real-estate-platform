import { NextRequest } from "next/server";
import { bookSpot } from "@/lib/shared-booking";

/**
 * POST /api/shared-bookings/[id]/book — Book one spot (increment bookedSpots).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await bookSpot(id);
    if (!updated) {
      return Response.json(
        { error: "Not found or no spots left" },
        { status: 400 }
      );
    }
    return Response.json(updated);
  } catch (e) {
    console.error("POST /api/shared-bookings/[id]/book:", e);
    return Response.json(
      { error: "Failed to book spot" },
      { status: 500 }
    );
  }
}
