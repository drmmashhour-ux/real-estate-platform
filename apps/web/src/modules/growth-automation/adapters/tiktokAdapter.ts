import type { AdapterResult } from "@/src/modules/growth-automation/domain/growth-automation.types";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";

/**
 * TikTok Content Posting API requires video upload + audit flow.
 */
export async function publishTikTok(_args: { accessToken: string; draft: DraftPayload }): Promise<AdapterResult> {
  return {
    ok: false,
    code: "TIKTOK_REQUIRES_VIDEO",
    message: "TikTok official posting requires video upload through Content Posting API. Caption-only is not supported here.",
  };
}
