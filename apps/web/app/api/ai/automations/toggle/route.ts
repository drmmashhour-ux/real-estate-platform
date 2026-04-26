import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
});

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const p = BodyZ.safeParse(json);
  if (!p.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await prisma.managerAiAutomationRule.update({
    where: { id: p.data.id },
    data: { enabled: p.data.enabled },
  });
  return NextResponse.json({ ok: true });
}
