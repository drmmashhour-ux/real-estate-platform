import { NextRequest } from "next/server";
import { prisma } from "@repo/db";

/**
 * PATCH /api/hotels/rooms/[id] — Update room (e.g. price).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, price, capacity } = body as {
      title?: string;
      price?: number;
      capacity?: number;
    };
    const data: { title?: string; price?: number; capacity?: number } = {};
    if (title !== undefined) data.title = String(title).trim();
    if (price !== undefined) data.price = Number(price);
    if (capacity !== undefined) data.capacity = Math.max(1, Math.floor(capacity));
    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }
    const room = await prisma.room.update({
      where: { id },
      data,
    });
    return Response.json(room);
  } catch (e) {
    console.error("PATCH /api/hotels/rooms/[id]:", e);
    return Response.json({ error: "Failed to update room" }, { status: 500 });
  }
}
