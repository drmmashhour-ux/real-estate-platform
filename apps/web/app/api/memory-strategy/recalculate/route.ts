import { NextRequest, NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { recalculatePlaybookStats } from "@/modules/playbook-memory/services/playbook-memory-learning.service";
import { runPlaybookLearningRollup } from "@/modules/playbook-memory/jobs/playbook-learning-rollup.job";

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
      playbookId = String((body as Record<string, unknown>).playbookId ?? "");
    }
  } catch {
    /* empty body */
  }

  if (playbookId) {
    await recalculatePlaybookStats(playbookId);
    return NextResponse.json({ ok: true, mode: "single", playbookId });
  }

  const rollup = await runPlaybookLearningRollup();
  return NextResponse.json({ ok: true, mode: "rollup", ...rollup });
}
