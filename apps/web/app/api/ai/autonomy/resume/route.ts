import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.managerAiPlatformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", autonomyPausedUntil: null },
    update: { autonomyPausedUntil: null },
  });
  await prisma.managerAiOverrideEvent.create({
    data: {
      actorUserId: userId,
      scope: "autonomy_resume",
    },
  });
  return NextResponse.json({ ok: true });
}
