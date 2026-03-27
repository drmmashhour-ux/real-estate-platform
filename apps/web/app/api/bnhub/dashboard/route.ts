import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  getBookingsThisMonth,
  getUpcomingGuests,
  getRevenueMTD,
  getRevenueForMonth,
  getRevenueYTD,
  getOccupancyRateLast30,
  ensureDemoBookings,
  ensurePlatformDemoBookings,
} from "@/lib/bnhub/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // If database has no bookings, create 3–5 demo bookings for first host with a listing
    const demoOwnerId = await ensurePlatformDemoBookings();

    const guestId = await getGuestId();
    let ownerId =
      request.nextUrl.searchParams.get("ownerId") ??
      guestId ??
      process.env.NEXT_PUBLIC_DEMO_HOST_ID ??
      demoOwnerId ??
      null;

    if (!ownerId) {
      return NextResponse.json({
        bookingsThisMonth: 0,
        occupancyRate: 0,
        upcomingGuests: 0,
        revenueMTD: 0,
        revenueThisMonth: 0,
        revenueLastMonth: 0,
        revenueYTD: 0,
      });
    }

    // Ensure this host has demo bookings if they have listings but no bookings
    await ensureDemoBookings(ownerId);

    const now = new Date();
    const [bookingsThisMonth, upcomingGuests, revenueMTD, occupancyRate, revenueLastMonth, revenueYTD] =
      await Promise.all([
        getBookingsThisMonth(ownerId),
        getUpcomingGuests(ownerId),
        getRevenueMTD(ownerId),
        getOccupancyRateLast30(ownerId),
        getRevenueForMonth(
          ownerId,
          now.getFullYear(),
          now.getMonth() - 1
        ),
        getRevenueYTD(ownerId),
      ]);

    return NextResponse.json({
      bookingsThisMonth,
      occupancyRate,
      upcomingGuests,
      revenueMTD,
      revenueThisMonth: revenueMTD,
      revenueLastMonth: revenueLastMonth,
      revenueYTD,
    });
  } catch (e) {
    console.error("GET /api/bnhub/dashboard:", e);
    return NextResponse.json(
      {
        bookingsThisMonth: 0,
        occupancyRate: 0,
        upcomingGuests: 0,
        revenueMTD: 0,
        revenueThisMonth: 0,
        revenueLastMonth: 0,
        revenueYTD: 0,
      },
      { status: 200 }
    );
  }
}
