/**
 * Rule-based marketing copy generator. Stores output in AiMarketingContent.
 * Does not call external LLM unless you extend this module.
 */

import { prisma } from "@/lib/db";

export type MarketingContentType = "listing_description" | "email_campaign" | "push" | "ad_text";

const TEMPLATES: Record<
  string,
  { contentType: MarketingContentType; title: string; body: (vars: Record<string, string>) => string }
> = {
  new_properties_area: {
    contentType: "email_campaign",
    title: "New properties in your area",
    body: (v) =>
      `Hi ${v.name || "there"},\n\nWe added new listings near ${v.area || "your saved search"}. Browse fresh inventory and book a showing.\n\n— Your real estate platform`,
  },
  price_drop: {
    contentType: "push",
    title: "Price update",
    body: (v) =>
      `Price dropped ${v.percent || "5%"} on a home you viewed (${v.address || "saved listing"}). Tap to see the new price.`,
  },
  similar_listings: {
    contentType: "ad_text",
    title: "Sponsored — similar homes",
    body: (v) =>
      `Similar ${v.beds || "2"}-bed homes in ${v.city || "your area"} from ${v.price || "$—"}. Compare photos & book tours.`,
  },
};

export function listMarketingTemplateKeys(): string[] {
  return Object.keys(TEMPLATES);
}

export async function generateMarketingFromTemplate(params: {
  templateKey: string;
  variables?: Record<string, string>;
  createdById?: string | null;
}): Promise<{ id: string; contentType: MarketingContentType; title: string; body: string }> {
  const tpl = TEMPLATES[params.templateKey];
  if (!tpl) {
    throw new Error(`Unknown template: ${params.templateKey}`);
  }
  const vars = params.variables ?? {};
  const body = tpl.body(vars);
  const row = await prisma.aiMarketingContent.create({
    data: {
      createdById: params.createdById ?? undefined,
      contentType: tpl.contentType,
      templateKey: params.templateKey,
      title: tpl.title,
      body,
      metadata: { variables: vars, engine: "rule_template_v1" },
    },
  });
  return { id: row.id, contentType: tpl.contentType as MarketingContentType, title: tpl.title, body };
}

/** Heuristic listing description from structured fields (no hallucinated facts). */
export function generateListingDescriptionStub(params: {
  title: string;
  city: string;
  beds: number;
  baths: number;
  priceHint?: string;
  highlights?: string[];
}): string {
  const h = (params.highlights ?? []).slice(0, 4).filter(Boolean);
  const highlightLine = h.length ? `Highlights: ${h.join("; ")}.` : "";
  return [
    `${params.title} — ${params.beds} bed, ${params.baths} bath in ${params.city}.`,
    params.priceHint ? `Asking ${params.priceHint}.` : "",
    highlightLine,
    "Contact a licensed broker for verified details and showings.",
  ]
    .filter(Boolean)
    .join(" ");
}
