import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { publishLecipmAiEvent } from "@/lib/realtime/lecipm-ai-events";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  enabled: z.boolean(),
  note: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const p = BodyZ.safeParse(json);
  if (!p.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  await prisma.managerAiPlatformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", globalKillSwitch: p.data.enabled },
    update: { globalKillSwitch: p.data.enabled },
  });
  await prisma.managerAiOverrideEvent.create({
    data: {
      actorUserId: userId,
      scope: p.data.enabled ? "kill_switch_on" : "kill_switch_off",
      note: p.data.note,
    },
  });
  await publishLecipmAiEvent({
    event: "ai_health_alert",
    payload: { killSwitch: p.data.enabled },
  });
  return NextResponse.json({ ok: true, globalKillSwitch: p.data.enabled });
}
