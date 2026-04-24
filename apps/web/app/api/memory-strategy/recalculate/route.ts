import { NextRequest, NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { recalculateAllPlaybookStats, recalculatePlaybookStats } from "@/modules/playbook-memory/services/playbook-memory-learning.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return Boolean(secret && token === secret);
}

export async function POST(req: NextRequest) {
  const cronOk = authorizeCron(req);
  const apiOk = await authorizePlaybookMemoryApi(req);
  if (!cronOk && !apiOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let playbookId: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body === "object" && "playbookId" in body) {
      const v = (body as Record<string, unknown>).playbookId;
      const s = typeof v === "string" ? v.trim() : v != null ? String(v) : "";
      playbookId = s || undefined;
    }
  } catch {
    /* empty */
  }

  if (playbookId) {
    const result = await recalculatePlaybookStats(playbookId);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, mode: "single" });
    }
    return NextResponse.json({ ok: true, mode: "single" as const, playbookId, result });
  }

  const all = await recalculateAllPlaybookStats();
  const updated = all.processed - all.failed;
  return NextResponse.json({
    ok: true,
    mode: "rollup" as const,
    updated,
    ...all,
  });
}
