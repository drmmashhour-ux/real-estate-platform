import { getListingsDB } from "@/lib/db/routeSwitch";

export const dynamic = "force-dynamic";

/**
 * First clean slice: marketplace `bookings` only via `listingsDB` (@repo/db-marketplace),
 * not the monolith. User/guest rows — when needed — use `coreDB` in services (no cross-Prisma relations).
 * Calendar / listing-scoped availability: `GET /api/listings/:id/bookings`.
 */
export async function GET() {
  const db = getListingsDB();
  console.log("[BOOKINGS DB] getListingsDB()");
  const bookings = await db.booking.findMany({
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
