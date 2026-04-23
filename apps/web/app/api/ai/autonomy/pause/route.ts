import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  until: z.string().datetime(),
  note: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const p = BodyZ.safeParse(json);
  if (!p.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const until = new Date(p.data.until);
  await prisma.managerAiPlatformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", autonomyPausedUntil: until },
    update: { autonomyPausedUntil: until },
  });
  await prisma.managerAiOverrideEvent.create({
    data: {
      actorUserId: userId,
      scope: "autonomy_pause",
      note: p.data.note,
      targetJson: { until: until.toISOString() } as object,
    },
  });
  return NextResponse.json({ ok: true, autonomyPausedUntil: until.toISOString() });
}
