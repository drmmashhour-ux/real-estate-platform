import type { NextRequest } from "next/server";
import { handleMarketingSchedulePost } from "@/lib/marketing/schedule-post-handler";

export const dynamic = "force-dynamic";

/**
 * Canonical scheduling endpoint. Sets `status = SCHEDULED` and `scheduled_at`.
 *
 * TODO: Cron/worker → `runScheduledContent()` in `future-automation-hooks.ts` (no auto-post without approval).
 */
export async function POST(request: NextRequest) {
  return handleMarketingSchedulePost(request);
}
