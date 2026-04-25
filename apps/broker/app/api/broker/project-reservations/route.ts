import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getUserRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const role = await getUserRole();
    const r = (role ?? "").toUpperCase();
    if (r !== "BROKER" && r !== "ADMIN") {
      return NextResponse.json([], { status: 200 });
    }
    const list = await prisma.projectReservation.findMany({
      include: {
        project: { select: { id: true, name: true } },
        unit: { select: { id: true, type: true, price: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("GET /api/broker/project-reservations:", e);
    return NextResponse.json([], { status: 200 });
  }
}
