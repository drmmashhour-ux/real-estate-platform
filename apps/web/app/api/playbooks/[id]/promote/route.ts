import { NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { promotePlaybookVersion } from "@/modules/playbook-memory/services/playbook-memory-lifecycle.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readPlaybookVersionId(body: unknown): string {
  if (body === null || typeof body !== "object") return "";
  const o = body as Record<string, unknown>;
  const a = o.playbookVersionId ?? o.versionId;
  return typeof a === "string" ? a.trim() : "";
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: playbookId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const playbookVersionId = readPlaybookVersionId(body);
  if (!playbookVersionId) {
    return NextResponse.json({ ok: false, error: "playbookVersionId required" }, { status: 400 });
  }

  const result = await promotePlaybookVersion({ playbookId, playbookVersionId });
  if (result.ok) {
    return NextResponse.json({ ok: true, result: result.data });
  }
  const status = result.error === "version_not_found" ? 404 : 400;
  return NextResponse.json({ ok: false, error: result.error }, { status });
}
