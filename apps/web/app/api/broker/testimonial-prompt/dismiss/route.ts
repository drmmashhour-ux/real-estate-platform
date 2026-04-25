import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role !== PlatformRole.BROKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { brokerTestimonialNudgeDismissedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
