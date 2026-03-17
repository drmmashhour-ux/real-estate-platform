import { NextRequest } from "next/server";
import { getBookingById } from "@/lib/bnhub/booking";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(booking);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}
