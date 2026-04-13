import { NextRequest } from "next/server";
import { enqueueAbandonedBookingEvents } from "@/lib/autonomy/enqueue-abandoned-booking-events";
import { processUnprocessedPlatformEvents } from "@/lib/autonomy/rule-dispatcher";
import { syncDefaultPlatformAutomationRules } from "@/lib/autonomy/sync-default-rules";
import { runAutomationRule, syncAutomationRuleDefinitions } from "@/lib/ai/actions/automation-engine";
import type { AutomationRuleKey } from "@/lib/ai/actions/automation-rules";

export const dynamic = "force-dynamic";

const BATCH_AUTOMATION: AutomationRuleKey[] = [
  "guest_abandoned_journey",
  "listing_visibility_gap",
  "re_engagement_host_drafts",
  "admin_daily_summary",
];

/**
 * POST /api/cron/platform-autonomy — enqueue abandoned-booking events, sync default rules, dispatch event bus.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncDefaultPlatformAutomationRules();
  await syncAutomationRuleDefinitions();
  const abandoned = await enqueueAbandonedBookingEvents(40);
  const dispatch = await processUnprocessedPlatformEvents(60);

  const batchResults: Record<string, { createdRecommendations: number; ok: boolean }> = {};
  for (const key of BATCH_AUTOMATION) {
    const r = await runAutomationRule(key);
    batchResults[key] = { createdRecommendations: r.createdRecommendations, ok: r.ok };
  }

  return Response.json({ ok: true, abandonedEvents: abandoned, ...dispatch, batchAutomation: batchResults });
}
