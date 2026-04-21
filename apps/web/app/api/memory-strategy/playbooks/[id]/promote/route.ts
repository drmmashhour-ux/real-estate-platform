import { NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { promotePlaybookVersion } from "@/modules/playbook-memory/services/playbook-memory-lifecycle.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playbookId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const versionId =
    typeof body === "object" && body !== null && "versionId" in body
      ? String((body as Record<string, unknown>).versionId ?? "")
      : "";

  if (!versionId) {
    return NextResponse.json({ error: "versionId required" }, { status: 400 });
  }

  try {
    await promotePlaybookVersion(playbookId, versionId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "promote_failed";
    const status = msg === "version_not_found" ? 404 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
