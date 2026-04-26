import { marketplacePrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Read-only: latest bookings for production verification (safe deploy phase).
 * Calendar / listing-scoped availability remains on `GET /api/listings/:id/bookings`.
 */
export async function GET() {
  const bookings = await marketplacePrisma.booking.findMany({
    take: 20,
    orderBy: { startDate: "desc" },
  });

  return Response.json(bookings);
}

export async function POST() {
  return Response.json(
    { error: "Bookings temporarily disabled in production" },
    { status: 403 }
  );
}
