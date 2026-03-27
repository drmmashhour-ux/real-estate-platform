import type { AdapterResult } from "@/src/modules/growth-automation/domain/growth-automation.types";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";

/**
 * Full video upload uses YouTube Data API v3 resumable upload. Not implemented in v1 — return explicit code.
 * Playlists / community posts can be added later.
 */
export async function publishYouTube(_args: {
  accessToken: string;
  draft: DraftPayload;
}): Promise<AdapterResult> {
  return {
    ok: false,
    code: "YOUTUBE_REQUIRES_MEDIA_UPLOAD",
    message:
      "YouTube publishing requires a video file via Data API v3 resumable upload. Use Studio upload or extend with multipart flow.",
  };
}
