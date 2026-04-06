import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { generateGrowthIdeas, generateGrowthIdeasVariants } from "@/lib/ai-marketing/generate-growth-ideas";
import { feedbackFromBodyWithAnalytics } from "@/lib/ai-marketing/feedback-from-request";
import { saveTextVariants } from "@/lib/ai-marketing/persist-variant-helpers";
import { growthIdeasBodySchema } from "@/lib/ai-marketing/schemas";
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

  const parsed = growthIdeasBodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return marketingJsonError(400, "Invalid input", "VALIDATION_ERROR");
  }

  try {
    const d = parsed.data;
    const feedback = await feedbackFromBodyWithAnalytics(d);
    const vc = Math.min(Math.max(d.variantCount ?? 1, 1), 3);
    const baseInput = {
      topic: d.topic?.trim() || "BNHub growth",
      audience: d.audience?.trim() || "hosts and travelers in EU markets",
      tone: d.tone?.trim() || undefined,
      context: d.context?.trim() || undefined,
      stage: d.stage,
      feedback,
    };

    if (vc === 1) {
      const result = await generateGrowthIdeas(baseInput);
      const flat = result.ideas.map((x, i) => `${i + 1}. ${x}`).join("\n");
      let contentId: string | null = null;
      if (shouldSaveGeneration(d)) {
        const userId = await getGuestId();
        const saved = await saveTextVariants({
          userId,
          type: "growth_idea",
          shared: {
            topic: d.topic?.trim() || "BNHub growth",
            tone: d.tone?.trim() || "professional",
            audience: d.audience?.trim() || "hosts and travelers in EU markets",
            contentJson: { stage: d.stage ?? "early" },
          },
          items: [{ label: "A", text: flat, aiSource: result.source, contentJson: { ideas: result.ideas, stage: d.stage ?? "early" } }],
        });
        contentId = saved.contentIds[0]!;
      }
      return marketingJsonOk({
        ideas: result.ideas,
        text: flat,
        source: result.source,
        contentId,
        variantCount: 1,
      });
    }

    const results = await generateGrowthIdeasVariants(baseInput, vc);
    let parentContentId: string | null = null;
    const variantPayload = results.map((r, i) => ({
      label: String.fromCharCode(65 + i),
      ideas: r.ideas,
      text: r.ideas.map((x, j) => `${j + 1}. ${x}`).join("\n"),
      contentId: null as string | null,
    }));

    if (shouldSaveGeneration(d)) {
      const userId = await getGuestId();
      const saved = await saveTextVariants({
        userId,
        type: "growth_idea",
        shared: {
          topic: d.topic?.trim() || "BNHub growth",
          tone: d.tone?.trim() || "professional",
          audience: d.audience?.trim() || "hosts and travelers in EU markets",
          contentJson: { stage: d.stage ?? "early", variantCount: vc },
        },
        items: results.map((r, i) => ({
          label: String.fromCharCode(65 + i),
          text: r.ideas.map((x, j) => `${j + 1}. ${x}`).join("\n"),
          aiSource: r.source,
          contentJson: { ideas: r.ideas, stage: d.stage ?? "early", variantIndex: i + 1, variantCount: vc },
        })),
      });
      parentContentId = saved.parentId;
      saved.contentIds.forEach((id, i) => {
        if (variantPayload[i]) variantPayload[i]!.contentId = id;
      });
    }

    return marketingJsonOk({
      variants: variantPayload,
      ideas: results[0]!.ideas,
      text: variantPayload[0]!.text,
      source: results[0]!.source,
      contentId: parentContentId,
      parentContentId,
      variantCount: vc,
    });
  } catch (e) {
    console.error("[api/ai/growth-ideas]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
