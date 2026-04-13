/**
 * Instagram Graph API — Content Publishing for IG Business (official API only).
 */

import { publishInstagramImage, publishInstagramReel } from "@/lib/integrations/meta/post";
import { getInstagramCredentialsForUser } from "./social-accounts";

export type InstagramPublishInput = {
  videoUrl: string;
  imageUrl?: string | null;
  caption: string;
  mode: "draft" | "direct";
  /** Admin user who connected Instagram — resolves encrypted token from DB */
  userId?: string;
};

export type InstagramPublishResult =
  | { ok: true; creationId?: string; externalPostId?: string }
  | { ok: false; error: string };

export async function publishToInstagram(input: InstagramPublishInput): Promise<InstagramPublishResult> {
  if (input.mode === "draft") {
    return { ok: false, error: "Draft mode: use scheduler or publish with mode=direct" };
  }

  let token: string | null = null;
  let igUserId: string | null = null;

  if (input.userId) {
    const creds = await getInstagramCredentialsForUser(input.userId);
    if (creds) {
      token = creds.accessToken;
      igUserId = creds.igUserId;
    }
  }

  if (!token || !igUserId) {
    token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim() ?? null;
    igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim() ?? null;
  }

  if (!token || !igUserId) {
    return {
      ok: false,
      error:
        "Instagram not connected: add Social account (admin → Social) or set INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_BUSINESS_ACCOUNT_ID",
    };
  }

  const caption = input.caption;
  const hasVideo = Boolean(input.videoUrl?.trim());

  if (hasVideo) {
    const r = await publishInstagramReel({
      igUserId,
      accessToken: token,
      videoUrl: input.videoUrl,
      caption,
    });
    if (!r.ok) return { ok: false, error: r.error };
    return { ok: true, creationId: r.creationId, externalPostId: r.mediaId };
  }

  const img = input.imageUrl?.trim();
  if (img) {
    const r = await publishInstagramImage({
      igUserId,
      accessToken: token,
      imageUrl: img,
      caption,
    });
    if (!r.ok) return { ok: false, error: r.error };
    return { ok: true, creationId: r.creationId, externalPostId: r.mediaId };
  }

  return { ok: false, error: "No video or image URL for Instagram publish" };
}
