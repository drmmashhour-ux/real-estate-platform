import { NextRequest } from "next/server";
import { processAutoReplyQueue } from "@/src/workers/autoReplyWorker";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/auto-reply-worker — classify + reply (~2 min cron).
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processAutoReplyQueue(40);
  return Response.json({
    ok: true,
    replies: { processed: result.processed, skipped: result.skipped, errors: result.errors },
    highIntentAssistNudge: {
      sent: result.highIntentNudgesSent,
      skipped: result.highIntentNudgesSkipped,
    },
  });
}
