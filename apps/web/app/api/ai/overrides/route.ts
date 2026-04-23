import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

const PostZ = z.object({
  scope: z.string().min(1).max(120),
  note: z.string().max(4000).optional(),
  targetJson: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.managerAiOverrideEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      scope: true,
      note: true,
      targetJson: true,
      createdAt: true,
      actorUserId: true,
    },
  });
  return NextResponse.json({ overrides: rows });
}

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const p = PostZ.safeParse(json);
  if (!p.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const row = await prisma.managerAiOverrideEvent.create({
    data: {
      actorUserId: userId,
      scope: p.data.scope,
      note: p.data.note,
      targetJson: p.data.targetJson as object | undefined,
    },
  });
  return NextResponse.json({ ok: true, id: row.id });
}
