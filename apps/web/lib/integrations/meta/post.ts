/**
 * Instagram Graph API — Reels / video publishing (official Content Publishing API).
 * @see https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 *
 * Video must be publicly reachable HTTPS URL; container status polled until FINISHED.
 */

import { graphGet, graphPostForm } from "./graph-client";

export type MetaPublishVideoInput = {
  igUserId: string;
  accessToken: string;
  videoUrl: string;
  caption: string;
};

export type MetaPublishVideoResult =
  | { ok: true; creationId: string; mediaId?: string }
  | { ok: false; error: string; code?: string };

const POLL_MS = 2000;
const POLL_MAX = 45;

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Create media container for Reels, poll processing, then publish.
 */
export async function publishInstagramReel(input: MetaPublishVideoInput): Promise<MetaPublishVideoResult> {
  const { igUserId, accessToken, videoUrl, caption } = input;
  try {
    const create = await graphPostForm<{ id: string }>(`/${igUserId}/media`, accessToken, {
      media_type: "REELS",
      video_url: videoUrl,
      caption: caption.slice(0, 2200),
    });
    const creationId = create.id;
    if (!creationId) {
      return { ok: false, error: "Meta did not return creation id" };
    }

    for (let i = 0; i < POLL_MAX; i++) {
      const status = await graphGet<{ status_code?: string }>(`/${creationId}`, accessToken, {
        fields: "status_code",
      });
      const code = status.status_code;
      if (code === "FINISHED" || code === "PUBLISHED") break;
      if (code === "ERROR" || code === "EXPIRED") {
        return { ok: false, error: "Media container processing failed", code: "CONTAINER_ERROR" };
      }
      await sleep(POLL_MS);
    }

    const pub = await graphPostForm<{ id?: string }>(`/${igUserId}/media_publish`, accessToken, {
      creation_id: creationId,
    });
    return { ok: true, creationId, mediaId: pub.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Instagram publish failed";
    return { ok: false, error: msg };
  }
}

/**
 * Post a feed image (single image) — optional path when video is not used.
 */
export async function publishInstagramImage(input: {
  igUserId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}): Promise<MetaPublishVideoResult> {
  try {
    const create = await graphPostForm<{ id: string }>(`/${input.igUserId}/media`, input.accessToken, {
      image_url: input.imageUrl,
      caption: input.caption.slice(0, 2200),
    });
    const creationId = create.id;
    for (let i = 0; i < POLL_MAX; i++) {
      const status = await graphGet<{ status_code?: string }>(`/${creationId}`, input.accessToken, {
        fields: "status_code",
      });
      if (status.status_code === "FINISHED" || status.status_code === "PUBLISHED") break;
      if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
        return { ok: false, error: "Image container failed" };
      }
      await sleep(POLL_MS);
    }
    const pub = await graphPostForm<{ id?: string }>(`/${input.igUserId}/media_publish`, input.accessToken, {
      creation_id: creationId,
    });
    return { ok: true, creationId, mediaId: pub.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Instagram image publish failed";
    return { ok: false, error: msg };
  }
}
