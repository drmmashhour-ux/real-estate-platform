import { NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import * as repo from "@/modules/playbook-memory/repository/playbook-memory.repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const pb = await repo.getMemoryPlaybookById(id);
  if (!pb) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, playbook: pb });
}
