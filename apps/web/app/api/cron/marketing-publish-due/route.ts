import { NextRequest } from "next/server";
import { runDueMarketingPublishes } from "@/lib/marketing-publish/run-scheduled";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron/marketing-publish-due — run SCHEDULED marketing rows that are due.
 * Only processes rows with publishDryRun=false (live-intent). Dry-run tests use admin UI.
 * Authorization: Bearer $CRON_SECRET
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const out = await runDueMarketingPublishes({ limit: 20, cronLiveOnly: true });
  return Response.json({
    ok: true,
    picked: out.picked,
    results: out.results.map((r) => ({
      ok: r.ok,
      code: r.code ?? null,
      jobId: r.jobId ?? null,
      contentStatus: r.contentStatus ?? null,
    })),
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
