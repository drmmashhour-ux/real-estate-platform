import { NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { pausePlaybook, resumePlaybook } from "@/modules/playbook-memory/services/playbook-memory-lifecycle.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST — pause or resume a playbook.
 * - Default: pauses. Optional body: `{ "reason"?: string }`
 * - Resume: `{ "action": "resume" }` with optional `reason` (e.g. `{ "action": "resume", "reason": "ops_approved" }`)
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: playbookId } = await ctx.params;
  let body: Record<string, unknown> = {};
  try {
    const j = await req.json();
    if (j && typeof j === "object" && !Array.isArray(j)) {
      body = j as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";
  const reason = body.reason != null ? String(body.reason) : undefined;

  if (action === "resume") {
    const result = await resumePlaybook({ playbookId, reason });
    if (result.ok) {
      return NextResponse.json({ ok: true, result: result.data });
    }
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const result = await pausePlaybook({ playbookId, reason });
  if (result.ok) {
    return NextResponse.json({ ok: true, result: result.data });
  }
  return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
}
