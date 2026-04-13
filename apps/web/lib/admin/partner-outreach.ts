/**
 * Internal admin copy: partner readiness, outreach templates, and resource pointers.
 * Not legal advice — counsel should review before sending contracts.
 */

export type ReadinessItem = { id: string; label: string; hint?: string };

export const PARTNER_READINESS_CHECKLIST: ReadinessItem[] = [
  {
    id: "entity",
    label: "Legal entity & signatory",
    hint: "Who signs NDAs and partner agreements (company name, jurisdiction).",
  },
  {
    id: "licensing",
    label: "Travel retail licensing (if you sell or package travel)",
    hint: "Confirm requirements in provinces/countries where you market (e.g. OPC, TICO). Affiliate-only may differ.",
  },
  {
    id: "privacy",
    label: "Privacy policy & cookie disclosure",
    hint: "Affiliate and analytics tracking must match what you publish.",
  },
  {
    id: "metrics",
    label: "Real traffic / conversion stats",
    hint: "MAU, monthly bookings, geos — only numbers you can substantiate.",
  },
  {
    id: "product",
    label: "Live product URL & BNHUB travel hub",
    hint: "https://…/bnhub/travel/compare and stays search — partners will click through.",
  },
  {
    id: "technical",
    label: "Integration preference defined",
    hint: "Tracked deep links vs API vs white-label — pick one to ask for.",
  },
  {
    id: "legal_review",
    label: "Counsel review for template agreements",
    hint: "Before countersigning revenue share or data-processing terms.",
  },
];

export const PARTNER_FOLLOW_UP_CHECKLIST: ReadinessItem[] = [
  { id: "f1", label: "Log date & contact name after first send" },
  { id: "f2", label: "Attach one-pager PDF if they request deck" },
  { id: "f3", label: "Escalate to BD lead after 2 weeks no reply" },
  { id: "f4", label: "Never imply an active partnership until contract or affiliate approval" },
];

export type EmailTemplateDef = {
  id: string;
  title: string;
  description: string;
  subjectTemplate: string;
  bodyTemplate: string;
};

export const PARTNER_EMAIL_TEMPLATES: EmailTemplateDef[] = [
  {
    id: "affiliate_intro",
    title: "Affiliate / referral program (first contact)",
    description: "Short intro when applying or emailing partnerships@ — affiliate track.",
    subjectTemplate: "Partnership inquiry — affiliate integration with {{PLATFORM_NAME}}",
    bodyTemplate: `Hello{{CONTACT_LINE}}

We operate {{PLATFORM_NAME}} ({{PLATFORM_URL}}), a real-estate and short-term rental platform with an expanding travel planning hub for guests (flights/packages education + optional partner links).

We would like to explore your official affiliate or partner program so we can send qualified traffic through approved tracking links, with clear disclosure to users.

Could you point us to the right application (e.g. partner portal or network) or the BD contact for mid-market integrations?

Thank you,
{{YOUR_NAME}}
{{YOUR_TITLE}}
{{YOUR_EMAIL}}`,
  },
  {
    id: "b2b_api",
    title: "B2B / API or connectivity (second stage)",
    description: "Use after affiliate path or when you have volume metrics.",
    subjectTemplate: "B2B partnership — connectivity / co-marketing ({{PLATFORM_NAME}})",
    bodyTemplate: `Hello{{CONTACT_LINE}}

Following our interest in your partner program: we are evaluating a deeper integration (search widget, deep link API, or co-marketed campaigns) for {{PLATFORM_NAME}}.

High level:
- Product: {{PLATFORM_URL}}
- Primary geos: {{GEOS}}
- Rough scale we can share under NDA: {{TRAFFIC_SUMMARY}}

We would welcome a short call with your partnerships or connectivity team to align on technical options and commercial structure.

Best regards,
{{YOUR_NAME}}
{{YOUR_TITLE}}
{{YOUR_EMAIL}}`,
  },
  {
    id: "onepager_ask",
    title: "Request for one-pager / deck exchange",
    description: "Light follow-up to move to materials swap.",
    subjectTemplate: "Materials for partnership review — {{PLATFORM_NAME}}",
    bodyTemplate: `Hello{{CONTACT_LINE}}

Happy to share a one-pager on {{PLATFORM_NAME}} (audience, BNHUB stays + travel assistant) and our compliance posture. Could you share your standard partner overview or rate card for the track we discussed (affiliate vs API)?

Thanks,
{{YOUR_NAME}}
{{YOUR_EMAIL}}`,
  },
];

export type ResourceLink = { label: string; href: string; note: string };

/** Starting points — verify URLs on the partner site before sending. */
export const PARTNER_RESOURCE_LINKS: ResourceLink[] = [
  {
    label: "CJ Affiliate (network many travel brands use)",
    href: "https://www.cj.com/",
    note: "Search for a brand’s program after you know the network.",
  },
  {
    label: "Impact.com (partner / affiliate platform)",
    href: "https://impact.com/",
    note: "Alternative partner network; brand-dependent.",
  },
  {
    label: "BNHUB Travel AI (your public hub)",
    href: "/bnhub/travel/compare",
    note: "Relative path — share full URL in emails.",
  },
];

export type TemplateVariables = Record<string, string>;

const DEFAULTS: TemplateVariables = {
  PLATFORM_NAME: "LECIPM",
  PLATFORM_URL: "https://example.com",
  YOUR_NAME: "",
  YOUR_TITLE: "",
  YOUR_EMAIL: "",
  COMPANY_NAME: "",
  CONTACT_LINE: "",
  GEOS: "Canada (specify provinces)",
  TRAFFIC_SUMMARY: "Available under NDA (e.g. monthly sessions / bookings).",
};

export function mergeTemplate(template: string, vars: TemplateVariables): string {
  const merged = { ...DEFAULTS, ...vars };
  let out = template;
  for (const [k, v] of Object.entries(merged)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

export function getEmailTemplateById(id: string): EmailTemplateDef | undefined {
  return PARTNER_EMAIL_TEMPLATES.find((t) => t.id === id);
}

/** {{CONTACT_LINE}} becomes " Name," or empty */
export function buildContactLine(contactName: string): string {
  const t = contactName.trim();
  if (!t) return "";
  return ` ${t},`;
}
