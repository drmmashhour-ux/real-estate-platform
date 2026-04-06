/**
 * Human-sent outreach templates — copy/paste or mailto only. No auto-send to external platforms.
 */

export type GrowthTemplateKey =
  | "owner_invite"
  | "broker_pitch"
  | "host_bnhub"
  | "buyer_early_access"
  | "follow_up_generic";

export type GrowthTemplate = {
  key: GrowthTemplateKey;
  label: string;
  subject: string;
  body: string;
};

const BASE = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://lecipm.com";

export const GROWTH_TEMPLATES: GrowthTemplate[] = [
  {
    key: "owner_invite",
    label: "Owner invite",
    subject: "Publish your property on LECIPM (permission-based)",
    body: `Hi {{name}},

We’re onboarding serious sellers and hosts on LECIPM — AI-assisted search, verified flows where applicable, and no copying from other sites (you bring your own description and media you’re allowed to share).

List when ready: ${BASE}/list-your-property

— LECIPM team`,
  },
  {
    key: "broker_pitch",
    label: "Broker / agent",
    subject: "Partner visibility for your listings — LECIPM",
    body: `Hi {{name}},

If you’d like another compliant channel for qualified inquiries, we can walk you through how LECIPM handles broker-led listings and contact unlocks.

— LECIPM partnerships`,
  },
  {
    key: "host_bnhub",
    label: "BNHub host",
    subject: "Direct bookings — lower friction than typical OTAs",
    body: `Hi {{name}},

BNHub on LECIPM is built for hosts who want clearer pricing and secure checkout. We don’t scrape or import your listing from other platforms — you confirm what you publish.

Explore: ${BASE}/bnhub/stays

— LECIPM BNHub`,
  },
  {
    key: "buyer_early_access",
    label: "Buyer early access",
    subject: "Your early access — LECIPM",
    body: `Hi {{name}},

Thanks for joining the early list. You’ll get product updates and smarter search as we roll out city by city.

Browse: ${BASE}/search

— LECIPM`,
  },
  {
    key: "follow_up_generic",
    label: "Follow-up",
    subject: "Following up — LECIPM",
    body: `Hi {{name}},

Just checking in — still interested in moving forward? Reply with a good time or any questions.

— LECIPM`,
  },
];

export function renderTemplate(
  key: GrowthTemplateKey,
  vars: { name?: string | null; city?: string | null }
): { subject: string; body: string } {
  const t = GROWTH_TEMPLATES.find((x) => x.key === key);
  if (!t) return { subject: "", body: "" };
  const name = vars.name?.trim() || "there";
  const city = vars.city?.trim() || "your area";
  const body = t.body.replace(/\{\{name\}\}/g, name).replace(/\{\{city\}\}/g, city);
  const subject = t.subject.replace(/\{\{name\}\}/g, name).replace(/\{\{city\}\}/g, city);
  return { subject, body };
}

export function mailtoLink(to: string | undefined, subject: string, body: string): string {
  const params = new URLSearchParams({
    subject: subject.slice(0, 200),
    body: body.slice(0, 8000),
  });
  const email = (to ?? "").trim();
  const q = params.toString();
  return email ? `mailto:${email}?${q}` : `mailto:?${q}`;
}
