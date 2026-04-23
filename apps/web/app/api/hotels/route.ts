import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { searchHotels } from "@/lib/hotel-hub";

/**
 * GET /api/hotels — Search hotels by location, dates, guests.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") ?? undefined;
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;
    const guests = searchParams.get("guests");
    const hotels = await searchHotels({
      location,
      checkIn,
      checkOut,
      guests: guests ? parseInt(guests, 10) : undefined,
    });
    return Response.json(hotels);
  } catch (e) {
    console.error("GET /api/hotels:", e);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}

/**
 * POST /api/hotels — Create a hotel (dashboard).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, location, description, images } = body as {
      name?: string;
      location?: string;
      description?: string;
      images?: string[];
    };
    if (!name?.trim() || !location?.trim()) {
      return Response.json(
        { error: "name and location are required" },
        { status: 400 }
      );
    }
    const hotel = await prisma.hotel.create({
      data: {
        name: name.trim(),
        location: location.trim(),
        description: description?.trim() ?? null,
        images: Array.isArray(images) ? images : [],
      },
    });
    return Response.json(hotel);
  } catch (e) {
    console.error("POST /api/hotels:", e);
    return Response.json({ error: "Failed to create hotel" }, { status: 500 });
  }
}
