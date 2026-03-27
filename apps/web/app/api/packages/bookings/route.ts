import { NextRequest } from "next/server";
import { getPackageById, createPackageBooking } from "@/lib/travel-packages";

/**
 * POST /api/packages/bookings — Create a package booking.
 * Body: packageId, guestName?, startDate, endDate, numberOfPeople
 * totalPrice is computed from package price (fixed price per booking).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      packageId,
      guestName,
      startDate: startDateStr,
      endDate: endDateStr,
      numberOfPeople,
    } = body as {
      packageId?: string;
      guestName?: string;
      startDate?: string;
      endDate?: string;
      numberOfPeople?: number;
    };

    if (!packageId?.trim()) {
      return Response.json(
        { error: "packageId is required" },
        { status: 400 }
      );
    }
    if (!startDateStr || !endDateStr) {
      return Response.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return Response.json({ error: "Invalid dates" }, { status: 400 });
    }
    if (endDate <= startDate) {
      return Response.json(
        { error: "endDate must be after startDate" },
        { status: 400 }
      );
    }
    const people = numberOfPeople != null ? Math.max(1, Math.floor(numberOfPeople)) : 1;

    const pkg = await getPackageById(packageId);
    if (!pkg) {
      return Response.json({ error: "Package not found" }, { status: 404 });
    }

    const totalPrice = pkg.price;

    const booking = await createPackageBooking({
      packageId,
      guestName: guestName?.trim() || undefined,
      startDate,
      endDate,
      numberOfPeople: people,
      totalPrice,
    });

    return Response.json(booking);
  } catch (e) {
    console.error("POST /api/packages/bookings:", e);
    return Response.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
