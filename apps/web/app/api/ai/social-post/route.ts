import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { generateSocialPost, generateSocialPostVariants } from "@/lib/ai-marketing/generate-social-post";
import { feedbackFromBodyWithAnalytics } from "@/lib/ai-marketing/feedback-from-request";
import { saveTextVariants } from "@/lib/ai-marketing/persist-variant-helpers";
import { socialPostBodySchema } from "@/lib/ai-marketing/schemas";
import { shouldSaveGeneration } from "@/lib/ai-marketing/save-generation-flag";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";
import { requireAdminSurfaceApi } from "../admin-guard";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return marketingJsonError(400, "Invalid JSON", "INVALID_JSON");
  }

  const parsed = socialPostBodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return marketingJsonError(400, "Invalid input", "VALIDATION_ERROR");
  }

  try {
    const d = parsed.data;
    const feedback = await feedbackFromBodyWithAnalytics(d);
    const vc = Math.min(Math.max(d.variantCount ?? 1, 1), 3);
    const baseInput = {
      topic: d.topic?.trim() || "BNHUB / LECIPM",
      platform: d.platform?.trim() || "Instagram",
      tone: d.tone?.trim() || "professional",
      audience: d.audience?.trim() || "travelers and hosts",
      context: d.context?.trim() || undefined,
      theme: d.theme,
      feedback,
    };

    if (vc === 1) {
      const result = await generateSocialPost(baseInput);
      let contentId: string | null = null;
      if (shouldSaveGeneration(d)) {
        const userId = await getGuestId();
        const saved = await saveTextVariants({
          userId,
          type: "social_post",
          shared: {
            platform: d.platform?.trim() || null,
            topic: d.topic?.trim() || "BNHUB / LECIPM",
            tone: d.tone?.trim() || "professional",
            audience: d.audience?.trim() || "travelers and hosts",
            theme: d.theme ?? null,
            contentJson: { theme: d.theme ?? null, context: d.context ?? null },
          },
          items: [{ label: "A", text: result.text, aiSource: result.source }],
        });
        contentId = saved.contentIds[0]!;
      }
      return marketingJsonOk({
        text: result.text,
        source: result.source,
        contentId,
        variantCount: 1,
      });
    }

    const results = await generateSocialPostVariants(baseInput, vc);
    let parentContentId: string | null = null;
    const variantPayload = results.map((r, i) => ({
      label: String.fromCharCode(65 + i),
      text: r.text,
      contentId: null as string | null,
    }));

    if (shouldSaveGeneration(d)) {
      const userId = await getGuestId();
      const saved = await saveTextVariants({
        userId,
        type: "social_post",
        shared: {
          platform: d.platform?.trim() || null,
          topic: d.topic?.trim() || "BNHUB / LECIPM",
          tone: d.tone?.trim() || "professional",
          audience: d.audience?.trim() || "travelers and hosts",
          theme: d.theme ?? null,
          contentJson: { theme: d.theme ?? null, context: d.context ?? null, variantCount: vc },
        },
        items: results.map((r, i) => ({
          label: String.fromCharCode(65 + i),
          text: r.text,
          aiSource: r.source,
          contentJson: { theme: d.theme ?? null, variantIndex: i + 1, variantCount: vc },
        })),
      });
      parentContentId = saved.parentId;
      saved.contentIds.forEach((id, i) => {
        if (variantPayload[i]) variantPayload[i]!.contentId = id;
      });
    }

    return marketingJsonOk({
      variants: variantPayload,
      text: results[0]!.text,
      source: results[0]!.source,
      contentId: parentContentId,
      parentContentId,
      variantCount: vc,
    });
  } catch (e) {
    console.error("[api/ai/social-post]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
