/**
 * TikTok Content Posting API — draft vs direct depends on app audit status.
 * @see https://developers.tiktok.com/doc/content-posting-api-get-started
 */

export type TikTokPublishInput = {
  videoUrl: string;
  caption: string;
  mode: "draft" | "direct";
};

export type TikTokPublishResult =
  | { ok: true; publishId?: string; externalPostId?: string }
  | { ok: false; error: string };

export async function publishToTikTok(input: TikTokPublishInput): Promise<TikTokPublishResult> {
  const clientId = process.env.TIKTOK_CLIENT_ID?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return { ok: false, error: "TIKTOK_CLIENT_ID / TIKTOK_CLIENT_SECRET not configured" };
  }

  // OAuth + upload flow belongs here; requires user access token from your TikTok login product.
  return {
    ok: false,
    error: `TikTok direct publish not wired (mode=${input.mode}). Requires OAuth user token and audited app.`,
  };
}
