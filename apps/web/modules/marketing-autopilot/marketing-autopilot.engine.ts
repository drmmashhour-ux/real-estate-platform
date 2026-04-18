import type { FsboListing } from "@prisma/client";
import { buildJustListedDraft, buildPriceUpdateDraft, buildSeoMetaDraft } from "../marketing-drafts/residential-copy-generator.service";
import { adaptBodyForChannel } from "../marketing-drafts/channel-adapter.service";
import type { MarketingAutopilotDraftPlan, MarketingAutopilotOutputType } from "./marketing-autopilot.types";
import { assertNoBannedPhrases } from "./marketing-policy.service";

export function buildPlansForListing(input: {
  listing: Pick<
    FsboListing,
    "id" | "title" | "titleFr" | "city" | "priceCents" | "bedrooms" | "bathrooms" | "listingCode" | "propertyType" | "images" | "description"
  >;
  kinds: MarketingAutopilotOutputType[];
  previousPriceCents?: number | null;
}): MarketingAutopilotDraftPlan[] {
  const plans: MarketingAutopilotDraftPlan[] = [];
  const L = input.listing;

  for (const k of input.kinds) {
    if (k === "just_listed" || k === "new_listing_announcement") {
      const j = buildJustListedDraft(L);
      const adapted = adaptBodyForChannel("social_post", j.body);
      plans.push({
        outputType: k,
        channel: "social_post",
        draftType: k,
        title: j.title,
        body: adapted.body,
        metadata: { scope: "residential", listingId: L.id },
      });
    }
    if (k === "price_update") {
      const p = buildPriceUpdateDraft(L, input.previousPriceCents ?? null);
      plans.push({
        outputType: k,
        channel: "email",
        draftType: k,
        title: p.title,
        subject: p.title,
        body: p.body,
        metadata: { scope: "residential", listingId: L.id },
      });
    }
    if (k === "seo_listing_page") {
      const s = buildSeoMetaDraft(L);
      plans.push({
        outputType: k,
        channel: "listing_page",
        draftType: k,
        title: s.seoTitle,
        body: `Title: ${s.seoTitle}\n\nMeta: ${s.seoDescription}`,
        metadata: { seoTitle: s.seoTitle, seoDescription: s.seoDescription, listingId: L.id },
      });
    }
    if (k === "sms_lead_update") {
      const j = buildJustListedDraft(L);
      const sms = adaptBodyForChannel("sms_short", j.body);
      plans.push({
        outputType: k,
        channel: "sms_short",
        draftType: k,
        body: sms.body,
        metadata: { scope: "residential", listingId: L.id },
      });
    }
    if (k === "ad_headline_variants") {
      plans.push({
        outputType: k,
        channel: "ad_copy",
        draftType: k,
        body: [`${L.title} — ${L.city}`, `${L.city} — résidentiel (voir fiche)`].join("\n"),
        metadata: { listingId: L.id, variants: 2 },
      });
    }
  }

  for (const p of plans) {
    const check = assertNoBannedPhrases(p.body);
    if (!check.ok) {
      p.body = `${p.body}\n\n[Note système: ${check.reason}]`;
    }
  }

  return plans;
}
