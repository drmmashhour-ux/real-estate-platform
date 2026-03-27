import type { AdapterResult } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { normalizeDraftPayload } from "@/src/modules/growth-automation/adapters/normalizeDraft";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { validateDraftForPlatform } from "@/src/modules/growth-automation/policies/growthAutomationPolicyService";

/**
 * LinkedIn Posts API (REST). Requires author URN (person or organization).
 * @see https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/posts-api
 */
export async function publishLinkedIn(args: {
  accessToken: string;
  authorUrn: string;
  draft: DraftPayload;
}): Promise<AdapterResult> {
  const v = validateDraftForPlatform("LINKEDIN", args.draft);
  if (!v.ok) return { ok: false, code: "VALIDATION", message: v.reason };
  const norm = normalizeDraftPayload("LINKEDIN", args.draft);
  const body = {
    author: args.authorUrn.startsWith("urn:") ? args.authorUrn : `urn:li:person:${args.authorUrn}`,
    commentary: norm.text.slice(0, 3000),
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByViewer: false,
  };
  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202405",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: { id?: string; message?: string } = {};
  try {
    json = JSON.parse(text) as { id?: string; message?: string };
  } catch {
    /* ignore */
  }
  const postId = res.headers.get("x-restli-id") || json.id;
  if (!res.ok) {
    return { ok: false, code: "LINKEDIN_API", message: json.message || text.slice(0, 500) };
  }
  return { ok: true, externalPostId: postId || "linkedin-post", raw: json };
}
