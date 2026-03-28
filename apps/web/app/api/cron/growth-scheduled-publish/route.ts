import { NextRequest } from "next/server";
import { listScheduledGrowthContentDue } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";
import { publishApprovedContent } from "@/src/modules/growth-automation/application/publishApprovedContent";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/growth-scheduled-publish — publish growth items whose scheduled time has passed.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await listScheduledGrowthContentDue(new Date(), 25);
  const results: { id: string; ok: boolean; message?: string }[] = [];

  for (const row of due) {
    try {
      const r = await publishApprovedContent(row.id);
      results.push({
        id: row.id,
        ok: r.ok,
        message: r.ok ? undefined : r.message,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      results.push({ id: row.id, ok: false, message });
    }
  }

  return Response.json({
    ok: true,
    count: due.length,
    results,
  });
}
