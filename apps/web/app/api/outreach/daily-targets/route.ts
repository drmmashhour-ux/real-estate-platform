import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getDailyTargets } from "@/modules/growth/target-builder.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "ADMIN" && user?.role !== "OPERATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targets = await getDailyTargets(5);
  return NextResponse.json({ targets });
}
