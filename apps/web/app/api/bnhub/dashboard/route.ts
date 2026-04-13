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
import {
  getActiveListingsCount,
  getAvgNightlyPriceCents,
  getBookingStatusBreakdown,
  getHostActivityFeed,
  getRevenueByDay,
  getTotalEarningsCents,
} from "@/lib/bnhub/dashboard-analytics";

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
        totalEarningsCents: 0,
        activeListings: 0,
        avgNightlyPriceCents: 0,
        revenueByDay: [],
        bookingStatusBreakdown: [],
        activityFeed: [],
      });
    }

    // Ensure this host has demo bookings if they have listings but no bookings
    await ensureDemoBookings(ownerId);

    const now = new Date();
    const [
      bookingsThisMonth,
      upcomingGuests,
      revenueMTD,
      occupancyRate,
      revenueLastMonth,
      revenueYTD,
      totalEarningsCents,
      activeListings,
      avgNightlyPriceCents,
      revenueByDay,
      bookingStatusBreakdown,
      activityFeed,
    ] = await Promise.all([
      getBookingsThisMonth(ownerId),
      getUpcomingGuests(ownerId),
      getRevenueMTD(ownerId),
      getOccupancyRateLast30(ownerId),
      getRevenueForMonth(ownerId, now.getFullYear(), now.getMonth() - 1),
      getRevenueYTD(ownerId),
      getTotalEarningsCents(ownerId),
      getActiveListingsCount(ownerId),
      getAvgNightlyPriceCents(ownerId),
      getRevenueByDay(ownerId, 14),
      getBookingStatusBreakdown(ownerId),
      getHostActivityFeed(ownerId, 12),
    ]);

    return NextResponse.json({
      bookingsThisMonth,
      occupancyRate,
      upcomingGuests,
      revenueMTD,
      revenueThisMonth: revenueMTD,
      revenueLastMonth: revenueLastMonth,
      revenueYTD,
      totalEarningsCents,
      activeListings,
      avgNightlyPriceCents,
      revenueByDay,
      bookingStatusBreakdown,
      activityFeed,
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
        totalEarningsCents: 0,
        activeListings: 0,
        avgNightlyPriceCents: 0,
        revenueByDay: [],
        bookingStatusBreakdown: [],
        activityFeed: [],
      },
      { status: 200 }
    );
  }
}
