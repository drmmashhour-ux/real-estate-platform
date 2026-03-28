import type { AdapterResult } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { normalizeDraftPayload } from "@/src/modules/growth-automation/adapters/normalizeDraft";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { validateDraftForPlatform } from "@/src/modules/growth-automation/policies/growthAutomationPolicyService";

/**
 * Instagram Graph API — content publishing requires a media container (image or reel).
 * @see https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */
export async function publishInstagram(args: {
  igUserId: string;
  accessToken: string;
  draft: DraftPayload;
}): Promise<AdapterResult> {
  const v = validateDraftForPlatform("INSTAGRAM", args.draft);
  if (!v.ok) return { ok: false, code: "VALIDATION", message: v.reason };
  const norm = normalizeDraftPayload("INSTAGRAM", args.draft);
  if (!norm.imageUrl) {
    return {
      ok: false,
      code: "IMAGE_REQUIRED",
      message:
        "Instagram publishing requires draft.metadata.mediaUrl (HTTPS image) for container creation in this integration.",
    };
  }
  const params = new URLSearchParams({
    image_url: norm.imageUrl,
    caption: norm.text.slice(0, 2200),
    access_token: args.accessToken,
  });
  const create = await fetch(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(args.igUserId)}/media?${params.toString()}`,
    { method: "POST" },
  );
  const created = (await create.json()) as { id?: string; error?: { message?: string } };
  if (!create.ok || !created.id) {
    return {
      ok: false,
      code: "GRAPH_API",
      message: created.error?.message || `HTTP ${create.status}`,
    };
  }
  const pub = await fetch(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(args.igUserId)}/media_publish?creation_id=${encodeURIComponent(
      created.id,
    )}&access_token=${encodeURIComponent(args.accessToken)}`,
    { method: "POST" },
  );
  const published = (await pub.json()) as { id?: string; error?: { message?: string } };
  if (!pub.ok || !published.id) {
    return {
      ok: false,
      code: "GRAPH_API_PUBLISH",
      message: published.error?.message || `HTTP ${pub.status}`,
    };
  }
  return { ok: true, externalPostId: published.id, raw: published };
}

/** Best-effort public fields on an IG Media id (requires a valid user access token). */
export async function fetchInstagramMediaEngagement(args: {
  mediaId: string;
  accessToken: string;
}): Promise<{ likes: number | null; comments: number | null } | null> {
  const url = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(args.mediaId)}`);
  url.searchParams.set("fields", "like_count,comments_count");
  url.searchParams.set("access_token", args.accessToken);
  const res = await fetch(url.toString());
  const json = (await res.json()) as {
    like_count?: number;
    comments_count?: number;
    error?: { message?: string };
  };
  if (!res.ok) {
    console.warn("[instagram] media engagement:", json.error?.message ?? res.status);
    return null;
  }
  return {
    likes: typeof json.like_count === "number" ? json.like_count : null,
    comments: typeof json.comments_count === "number" ? json.comments_count : null,
  };
}
