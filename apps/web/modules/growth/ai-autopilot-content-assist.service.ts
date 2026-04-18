/**
 * Deterministic content drafts — no LLM, no publish, no ads APIs.
 */

import { aiAutopilotContentAssistFlags } from "@/config/feature-flags";
import type { AiContentDraft, GrowthContentHubSnapshot } from "./ai-autopilot-content.types";

export type AdCopyContext = {
  campaignName?: string;
  utmCampaign?: string;
  leadSegment?: string;
};

export type ListingCopyInput = NonNullable<GrowthContentHubSnapshot["listing"]>;

export type OutreachContext = {
  leadNameHint?: string;
  city?: string;
  leadSegment?: string;
};

function isoNow(now?: string): string {
  return now ?? new Date().toISOString();
}

function segLabel(segment?: string): string {
  if (!segment?.trim()) return "property owners";
  return segment.trim();
}

const FORBIDDEN = /\b(guarantee|guaranteed|100%\s*(success|results)|no\s+risk)\b/i;

function assertSafeCopy(text: string, context: string): void {
  if (FORBIDDEN.test(text)) {
    throw new Error(`unsafe_copy:${context}`);
  }
}

/** Three ad variants: hook, standard, value-focused — no outcome guarantees. */
export function generateAdCopyDrafts(context: AdCopyContext, opts?: { now?: string; refreshKey?: number }): AiContentDraft[] {
  if (!aiAutopilotContentAssistFlags.adCopyV1 || !aiAutopilotContentAssistFlags.contentAssistV1) {
    return [];
  }
  const createdAt = isoNow(opts?.now);
  const rk = opts?.refreshKey ?? 0;
  const camp = context.utmCampaign?.trim() || context.campaignName?.trim();
  const seg = segLabel(context.leadSegment);
  const suffix = camp ? ` (${camp})` : "";

  const a: AiContentDraft = {
    id: `ad_copy-short-${rk}`,
    type: "ad_copy",
    body: `Reach serious buyers for your property faster — tools that save you time${suffix}.`,
    variant: "short",
    tone: "high-conversion",
    rationale: rk % 2 === 0 ? "Short hook for ads" : "Short hook for ads (alt)",
    createdAt,
  };
  const b: AiContentDraft = {
    id: `ad_copy-standard-${rk}`,
    type: "ad_copy",
    body: `List your property and receive qualified inquiries. We connect ${seg} with people actively looking — less noise, clearer conversations.`,
    variant: "standard",
    tone: "professional",
    rationale: "Professional tone for trust",
    createdAt,
  };
  const c: AiContentDraft = {
    id: `ad_copy-long-${rk}`,
    type: "ad_copy",
    body: `Bring more visibility to your listing. Our platform helps match your property with interested buyers and streamlines follow-up — you stay in control of next steps.`,
    variant: "long",
    tone: "high-conversion",
    rationale: "Optimized for clarity and conversion-oriented messaging",
    createdAt,
  };
  for (const d of [a, b, c]) {
    assertSafeCopy(d.body, d.id);
  }
  return [a, b, c];
}

/** Listing title + description variants — does not modify live listing data. */
export function generateListingCopyDrafts(listing: ListingCopyInput, opts?: { now?: string; refreshKey?: number }): AiContentDraft[] {
  if (!aiAutopilotContentAssistFlags.listingCopyV1 || !aiAutopilotContentAssistFlags.contentAssistV1) {
    return [];
  }
  const createdAt = isoNow(opts?.now);
  const rk = opts?.refreshKey ?? 0;
  const city = listing.city?.trim() ?? "this area";
  const pt = listing.propertyType?.trim() ?? "home";
  const baseTitle = listing.title?.trim() || `Bright ${pt} in ${city}`;
  const highlights = (listing.highlights ?? []).filter(Boolean).slice(0, 3);
  const hl = highlights.length ? ` Highlights: ${highlights.join("; ")}.` : "";

  const short: AiContentDraft = {
    id: `listing_copy-short-${rk}`,
    type: "listing_copy",
    title: baseTitle,
    body: `Well-presented ${pt} in ${city}.${hl} See details and book a visit when it works for you.`,
    variant: "short",
    tone: "friendly",
    rationale: "Concise overview for browse-heavy channels",
    createdAt,
  };
  const standard: AiContentDraft = {
    id: `listing_copy-standard-${rk}`,
    type: "listing_copy",
    title: `${baseTitle} — move-in friendly`,
    body: `Thoughtfully maintained ${pt} in ${city}. Comfortable layout, practical location, and clear next steps to learn more.${hl}`,
    variant: "standard",
    tone: "professional",
    rationale: "Professional tone for trust",
    createdAt,
  };
  const rawDesc = listing.description?.trim();
  const safeNotes =
    rawDesc && !FORBIDDEN.test(rawDesc) ? `${rawDesc.slice(0, 200)}${rawDesc.length > 200 ? "…" : ""}` : "";
  const long: AiContentDraft = {
    id: `listing_copy-long-${rk}`,
    type: "listing_copy",
    title: `${baseTitle}`,
    body: `Discover a ${pt} that balances everyday comfort with a practical ${city} location.${
      safeNotes ? ` Starting point from your notes: ${safeNotes}` : ""
    }${hl} Review photos and details, then reach out with questions.`,
    variant: "long",
    tone: "professional",
    rationale: "Longer description for listing pages and exports",
    createdAt,
  };
  for (const d of [short, standard, long]) {
    assertSafeCopy(d.body, d.id);
  }
  return [short, standard, long];
}

/** First contact, follow-up, and short nudge — no pressure or fake urgency. */
export function generateOutreachDrafts(context: OutreachContext, opts?: { now?: string; refreshKey?: number }): AiContentDraft[] {
  if (!aiAutopilotContentAssistFlags.outreachCopyV1 || !aiAutopilotContentAssistFlags.contentAssistV1) {
    return [];
  }
  const createdAt = isoNow(opts?.now);
  const rk = opts?.refreshKey ?? 0;
  const city = context.city?.trim() ?? "your area";
  const seg = segLabel(context.leadSegment);

  const first: AiContentDraft = {
    id: `outreach_copy-standard-${rk}-a`,
    type: "outreach_copy",
    body: `Hi — I noticed your property in ${city}. If helpful, we can share ways to reach qualified interest and keep follow-up organized on your terms.`,
    variant: "standard",
    tone: "friendly",
    rationale: "First contact — respectful and low-pressure",
    createdAt,
  };
  const follow: AiContentDraft = {
    id: `outreach_copy-long-${rk}-b`,
    type: "outreach_copy",
    body: `Just following up in case this is useful. We work with ${seg} to improve visibility and serious inquiries — happy to share a short overview whenever convenient.`,
    variant: "long",
    tone: "professional",
    rationale: "Follow-up without pressure",
    createdAt,
  };
  const short: AiContentDraft = {
    id: `outreach_copy-short-${rk}-c`,
    type: "outreach_copy",
    body: `Hi — if you want more visibility for your listing in ${city}, I can share a quick, no-obligation overview.`,
    variant: "short",
    tone: "friendly",
    rationale: "Short option for quick channels",
    createdAt,
  };
  for (const d of [first, follow, short]) {
    assertSafeCopy(d.body, d.id);
  }
  return [first, follow, short];
}

export type ContentAssistInput = GrowthContentHubSnapshot & { refreshKey?: number; now?: string };

/** Aggregate drafts respecting sub-flags — never writes to DB. */
export function generateContentDrafts(input: ContentAssistInput): AiContentDraft[] {
  if (!aiAutopilotContentAssistFlags.contentAssistV1) {
    return [];
  }
  const out: AiContentDraft[] = [];
  const rk = input.refreshKey ?? 0;
  const now = input.now;
  out.push(
    ...generateAdCopyDrafts(
      {
        campaignName: input.campaign?.name,
        utmCampaign: input.campaign?.utmCampaign,
        leadSegment: input.leadSegment,
      },
      { now, refreshKey: rk },
    ),
  );
  if (input.listing) {
    out.push(...generateListingCopyDrafts(input.listing, { now, refreshKey: rk }));
  }
  out.push(
    ...generateOutreachDrafts(
      { city: input.listing?.city, leadSegment: input.leadSegment },
      { now, refreshKey: rk },
    ),
  );
  return out;
}
