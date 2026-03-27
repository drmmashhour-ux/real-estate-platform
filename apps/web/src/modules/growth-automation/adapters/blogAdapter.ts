import type { AdapterResult } from "@/src/modules/growth-automation/domain/growth-automation.types";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { normalizeDraftPayload } from "@/src/modules/growth-automation/adapters/normalizeDraft";

/**
 * Internal CMS / webhook — set GROWTH_BLOG_PUBLISH_URL and optional GROWTH_BLOG_PUBLISH_TOKEN.
 */
export async function publishBlog(args: { draft: DraftPayload }): Promise<AdapterResult> {
  const url = process.env.GROWTH_BLOG_PUBLISH_URL?.trim();
  if (!url) {
    return { ok: false, code: "BLOG_WEBHOOK_MISSING", message: "Set GROWTH_BLOG_PUBLISH_URL for blog adapter." };
  }
  const norm = normalizeDraftPayload("BLOG", args.draft);
  const token = process.env.GROWTH_BLOG_PUBLISH_TOKEN?.trim();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      title: norm.title || norm.text.slice(0, 80),
      bodyMarkdown: norm.text,
      meta: norm.raw,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok) {
    return { ok: false, code: "BLOG_WEBHOOK", message: json.error || `HTTP ${res.status}` };
  }
  return { ok: true, externalPostId: json.id || `blog-${Date.now()}`, raw: json };
}
