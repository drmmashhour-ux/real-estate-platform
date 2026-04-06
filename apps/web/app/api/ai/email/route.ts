import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { generateEmail, generateEmailVariants } from "@/lib/ai-marketing/generate-email";
import { feedbackFromBodyWithAnalytics } from "@/lib/ai-marketing/feedback-from-request";
import { emailBodySchema } from "@/lib/ai-marketing/schemas";
import { shouldSaveGeneration } from "@/lib/ai-marketing/save-generation-flag";
import { createDraft, createVariantDraftGroup } from "@/lib/marketing/marketing-content-service";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";
import { requireAdminSurfaceApi } from "../admin-guard";

export const dynamic = "force-dynamic";

function flatEmail(subject: string, body: string, cta: string) {
  return [`Subject: ${subject}`, "", body, "", `CTA: ${cta}`].join("\n");
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return marketingJsonError(400, "Invalid JSON", "INVALID_JSON");
  }

  const parsed = emailBodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return marketingJsonError(400, "Invalid input", "VALIDATION_ERROR");
  }

  try {
    const d = parsed.data;
    const feedback = await feedbackFromBodyWithAnalytics(d);
    const vc = Math.min(Math.max(d.variantCount ?? 1, 1), 3);
    const baseInput = {
      topic: d.topic?.trim() || "BNHub / LECIPM",
      tone: d.tone?.trim() || "professional",
      audience: d.audience?.trim() || "prospective partners",
      context: d.context?.trim() || undefined,
      emailKind: d.emailKind ?? "promotional",
      partnerType: d.partnerType?.trim() || undefined,
      feedback,
    };

    if (vc === 1) {
      const result = await generateEmail(baseInput);
      const flatContent = flatEmail(result.subject, result.body, result.cta);
      let contentId: string | null = null;
      if (shouldSaveGeneration(d)) {
        const userId = await getGuestId();
        contentId = await createDraft({
          userId,
          type: "email",
          content: flatContent,
          contentJson: { emailKind: d.emailKind ?? "promotional" },
          topic: d.topic?.trim() || "BNHub / LECIPM",
          tone: d.tone?.trim() || "professional",
          audience: d.audience?.trim() || "prospective partners",
          aiSource: result.source,
          email: {
            subject: result.subject,
            body: result.body,
            cta: result.cta,
            isEmailCampaign: d.isEmailCampaign === true,
          },
        });
      }
      return marketingJsonOk({
        subject: result.subject,
        body: result.body,
        cta: result.cta,
        source: result.source,
        contentId,
        variantCount: 1,
      });
    }

    const results = await generateEmailVariants(baseInput, vc);
    let parentContentId: string | null = null;
    const variantPayload = results.map((r, i) => ({
      label: String.fromCharCode(65 + i),
      subject: r.subject,
      body: r.body,
      cta: r.cta,
      contentId: null as string | null,
    }));

    if (shouldSaveGeneration(d)) {
      const userId = await getGuestId();
      const { parentId, allIds } = await createVariantDraftGroup({
        userId,
        type: "email",
        shared: {
          topic: d.topic?.trim() || "BNHub / LECIPM",
          tone: d.tone?.trim() || "professional",
          audience: d.audience?.trim() || "prospective partners",
          contentJson: { emailKind: d.emailKind ?? "promotional", variantCount: vc },
          isEmailCampaign: d.isEmailCampaign === true,
        },
        items: results.map((r, i) => ({
          label: String.fromCharCode(65 + i),
          content: flatEmail(r.subject, r.body, r.cta),
          aiSource: r.source,
          contentJson: { emailKind: d.emailKind ?? "promotional", variantIndex: i + 1, variantCount: vc },
          email: {
            subject: r.subject,
            body: r.body,
            cta: r.cta,
            isEmailCampaign: d.isEmailCampaign === true,
          },
        })),
      });
      parentContentId = parentId;
      allIds.forEach((id, i) => {
        if (variantPayload[i]) variantPayload[i]!.contentId = id;
      });
    }

    return marketingJsonOk({
      variants: variantPayload,
      subject: results[0]!.subject,
      body: results[0]!.body,
      cta: results[0]!.cta,
      source: results[0]!.source,
      contentId: parentContentId,
      parentContentId,
      variantCount: vc,
    });
  } catch (e) {
    console.error("[api/ai/email]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
