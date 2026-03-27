import { getSharedBookings } from "@/lib/shared-booking";

/**
 * GET /api/shared-bookings — List all shared bookings.
 */
export async function GET() {
  try {
    const list = await getSharedBookings();
    return Response.json(list);
  } catch (e) {
    console.error("GET /api/shared-bookings:", e);
    return Response.json(
      { error: "Failed to load shared bookings" },
      { status: 500 }
    );
  }
}
