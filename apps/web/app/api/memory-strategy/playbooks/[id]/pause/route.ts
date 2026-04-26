import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    await prisma.memoryPlaybook.update({
      where: { id },
      data: { status: "PAUSED" },
    });
    await prisma.memoryPlaybookLifecycleEvent.create({
      data: {
        playbookId: id,
        eventType: "pause",
        reason: "manual_api",
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "pause_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
