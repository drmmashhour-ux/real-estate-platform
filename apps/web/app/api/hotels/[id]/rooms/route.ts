import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * POST /api/hotels/[id]/rooms — Create a room for a hotel.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hotelId } = await params;
    const body = await request.json();
    const { title, price, capacity } = body as {
      title?: string;
      price?: number;
      capacity?: number;
    };
    if (!title?.trim() || price == null || price < 0) {
      return Response.json(
        { error: "title and price are required; price must be >= 0" },
        { status: 400 }
      );
    }
    const room = await prisma.room.create({
      data: {
        hotelId,
        title: title.trim(),
        price: Number(price),
        capacity: capacity != null && capacity >= 1 ? Math.floor(capacity) : 2,
      },
    });
    return Response.json(room);
  } catch (e) {
    console.error("POST /api/hotels/[id]/rooms:", e);
    return Response.json({ error: "Failed to create room" }, { status: 500 });
  }
}
