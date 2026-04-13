import { graphPostForm } from "./graph-client";

export type FacebookVideoPublishInput = {
  pageId: string;
  pageAccessToken: string;
  videoUrl: string;
  description: string;
};

export type FacebookVideoPublishResult =
  | { ok: true; videoId?: string }
  | { ok: false; error: string };

/**
 * Publish a video to a Facebook Page feed (official Graph Video API).
 */
export async function publishFacebookPageVideo(input: FacebookVideoPublishInput): Promise<FacebookVideoPublishResult> {
  try {
    const res = await graphPostForm<{ id?: string }>(`/${input.pageId}/videos`, input.pageAccessToken, {
      file_url: input.videoUrl,
      description: input.description.slice(0, 8000),
    });
    return { ok: true, videoId: res.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Facebook publish failed" };
  }
}
