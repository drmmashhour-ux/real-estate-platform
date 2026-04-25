import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const bookings = await prisma.demoBooking.findMany({
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
