import type { NextRequest } from "next/server";
import { handleMarketingSchedulePost } from "@/lib/marketing/schedule-post-handler";

export const dynamic = "force-dynamic";

/**
 * @deprecated Use `POST /api/marketing/schedule` — same behavior (thin delegate).
 */
export async function POST(request: NextRequest) {
  return handleMarketingSchedulePost(request);
}
