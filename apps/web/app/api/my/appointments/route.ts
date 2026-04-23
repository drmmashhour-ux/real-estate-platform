import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const appointments = await prisma.appointment.findMany({
    where: { clientUserId: userId },
    orderBy: { startsAt: "desc" },
    take: 100,
    include: {
      broker: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ ok: true, appointments });
}
