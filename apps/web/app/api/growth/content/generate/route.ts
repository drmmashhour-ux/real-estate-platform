import { NextResponse } from "next/server";
import { GrowthMarketingPlatform } from "@prisma/client";
import { generateContentForChannel } from "@/src/modules/growth-automation/application/generateContentForChannel";
import type { BlogPostDraft } from "@/src/modules/growth-automation/application/generateBlogPost";
import { createContentDraft } from "@/src/modules/growth-automation/application/createContentDraft";
import type { EmailDraft } from "@/src/modules/growth-automation/application/generateEmailDraft";
import type { ShortVideoScript } from "@/src/modules/growth-automation/application/generateShortVideoScript";
import type { YouTubeScript } from "@/src/modules/growth-automation/application/generateYouTubeScript";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { isContentFamily } from "@/src/modules/growth-automation/domain/contentFamilies";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";

export const dynamic = "force-dynamic";

const PLATFORMS = new Set(Object.values(GrowthMarketingPlatform));

type GeneratedBundle =
  | { kind: "post"; payload: DraftPayload }
  | { kind: "caption"; payload: DraftPayload }
  | { kind: "article"; payload: BlogPostDraft }
  | { kind: "email"; payload: EmailDraft }
  | { kind: "long_script"; payload: YouTubeScript }
  | { kind: "short_script+caption"; payload: { script: ShortVideoScript; caption: DraftPayload } };

function toDraftPayload(
  productOrFeature: string,
  generated: GeneratedBundle,
): DraftPayload {
  switch (generated.kind) {
    case "post":
    case "caption":
      return generated.payload;
    case "article": {
      const p = generated.payload;
      return {
        hook: p.title,
        body: p.bodyMarkdown,
        cta: p.cta,
        sourceProductOrFeature: p.sourceProductOrFeature || productOrFeature,
        title: p.title,
        metadata: { metaDescription: p.metaDescription, slugSuggestion: p.slugSuggestion },
      };
    }
    case "email": {
      const p = generated.payload;
      return {
        hook: p.subject,
        body: p.bodyHtml,
        cta: p.ctaLabel,
        sourceProductOrFeature: p.sourceProductOrFeature || productOrFeature,
        metadata: { preheader: p.preheader, ctaUrl: p.ctaUrl },
      };
    }
    case "long_script": {
      const p = generated.payload;
      return {
        hook: p.title,
        body: p.sections.map((s) => `## ${s.heading}\n${s.script}`).join("\n\n"),
        cta: p.cta,
        sourceProductOrFeature: productOrFeature,
        title: p.title,
        metadata: { description: p.description, tags: p.suggestedTags },
      };
    }
    case "short_script+caption": {
      const p = generated.payload;
      return {
        hook: p.caption.hook,
        body: `${p.script.beats.join(" → ")}\n\n${p.caption.body}`,
        cta: p.script.cta,
        sourceProductOrFeature: productOrFeature,
        metadata: { script: p.script, caption: p.caption },
      };
    }
  }
}

export async function POST(req: Request) {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const platform = body.platform as GrowthMarketingPlatform;
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const contentFamily = typeof body.contentFamily === "string" ? body.contentFamily : "";
  const productOrFeature =
    typeof body.productOrFeature === "string" ? body.productOrFeature.trim() : "LECIPM workspace";
  const link = typeof body.link === "string" ? body.link.trim() : undefined;
  const saveDraft = Boolean(body.saveDraft);

  if (!topic || !PLATFORMS.has(platform) || !isContentFamily(contentFamily)) {
    return NextResponse.json(
      { error: "topic, valid platform, and contentFamily (see LECIPM content families) are required" },
      { status: 400 },
    );
  }

  const generated = (await generateContentForChannel({
    platform,
    topic,
    contentFamily,
    productOrFeature,
    link,
  })) as GeneratedBundle;

  if (!saveDraft) {
    return NextResponse.json({ generated });
  }

  const draftPayload = toDraftPayload(productOrFeature, generated);

  const item = await createContentDraft({
    contentType: generated.kind,
    topic,
    platform,
    draftPayload,
    marketingChannelId: typeof body.marketingChannelId === "string" ? body.marketingChannelId : null,
  });

  return NextResponse.json({ generated, itemId: item.id, status: item.status });
}
