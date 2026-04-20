import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { runAutonomyDueBatch } from "@/modules/autonomy/autonomy-orchestrator.service";

export const dynamic = "force-dynamic";

async function authorize(req: Request): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const secretHeader = req.headers.get("x-autonomy-cron-secret")?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const expected = process.env.AUTONOMY_CRON_SECRET?.trim();
  if (expected && (secretHeader === expected || bearer === expected)) {
    return { ok: true };
  }

  const admin = await requireRole("admin");
  if (!admin.ok) return { ok: false, response: admin.response };
  return { ok: true };
}

/**
 * POST/GET — batch autonomy cycles for every enabled config.
 * Authenticate with `x-autonomy-cron-secret` or `Authorization: Bearer $AUTONOMY_CRON_SECRET`, or admin session.
 * Prefer `/api/cron/autonomy-run-due` + `CRON_SECRET` for Vercel Cron (same pattern as other platform crons).
 */
async function handle(req: Request) {
  const gate = await authorize(req);
  if (!gate.ok) return gate.response;

  try {
    const out = await runAutonomyDueBatch({ take: 50 });
    return NextResponse.json({ success: true, processed: out.processed, results: out.results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Autonomy batch failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
