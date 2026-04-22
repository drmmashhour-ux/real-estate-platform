/**
 * SEO landing definitions for the automated growth engine (Québec / Canada broker acquisition).
 * Pages are rendered at `/[locale]/[country]/growth-seo/[slug]` with optional short URLs via rewrites.
 */

export const GROWTH_SEO_SLUGS = [
  "broker-software-quebec",
  "real-estate-crm-ai",
  "tenant-screening-canada",
  "esg-real-estate-platform",
] as const;

export type GrowthSeoSlug = (typeof GROWTH_SEO_SLUGS)[number];

export type GrowthSeoSection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

export type GrowthSeoPageDefinition = {
  slug: GrowthSeoSlug;
  title: string;
  description: string;
  keywords: string[];
  hero: string;
  sections: GrowthSeoSection[];
  ctaLabel: string;
  ctaHref: string;
  jsonLdType: "WebPage" | "SoftwareApplication";
};

const SIGNUP_PATH = "/auth/signup";

function ctaSignup(locale: string, country: string): string {
  return `/${locale}/${country}${SIGNUP_PATH}`;
}

export function buildSeoLandingDefinitions(locale: string, country: string): Record<GrowthSeoSlug, GrowthSeoPageDefinition> {
  const signup = ctaSignup(locale, country);
  return {
    "broker-software-quebec": {
      slug: "broker-software-quebec",
      title: "Broker software Québec | OACIQ-aligned deal files & CRM | LECIPM",
      description:
        "Modern broker workspace for Québec: Centris-style transaction numbers, compliance-aware documents, and AI-assisted workflows built for independent brokers and small agencies.",
      keywords: [
        "broker software Québec",
        "OACIQ CRM",
        "real estate transaction file software",
        "Montreal broker tools",
        "LECIPM",
      ],
      hero: "Run your Québec brokerage on one platform — from first contact to signature.",
      sections: [
        {
          heading: "Built for independent brokers and growing teams",
          body: [
            "LECIPM centralizes listings intelligence, buyer conversations, and transaction files so you spend less time on admin and more time closing.",
            "Designed with Québec regulatory context in mind — structure that supports disciplined documentation without slowing you down.",
          ],
          bullets: [
            "Transaction workspace with traceable milestones",
            "Document generation with mandatory deal identifiers",
            "Pipeline visibility for small agencies",
          ],
        },
        {
          heading: "Why teams switch",
          body: [
            "Fragmented spreadsheets and inbox-only workflows create compliance gaps. LECIPM gives you a single source of truth per deal with audit-friendly events.",
          ],
        },
      ],
      ctaLabel: "Start broker workspace",
      ctaHref: signup,
      jsonLdType: "SoftwareApplication",
    },
    "real-estate-crm-ai": {
      slug: "real-estate-crm-ai",
      title: "Real estate CRM + AI | Lead routing, follow-ups & deal intelligence | LECIPM",
      description:
        "AI-assisted CRM for residential brokers: prioritize hot leads, automate follow-up drafts, and keep every touchpoint tied to the right listing and transaction.",
      keywords: [
        "real estate CRM AI",
        "broker lead automation",
        "deal intelligence CRM",
        "Canada real estate software",
      ],
      hero: "AI that amplifies your judgement — not replaces it.",
      sections: [
        {
          heading: "Productivity without losing the human touch",
          body: [
            "Surface the next best action from lead behaviour, listing engagement, and pipeline stage.",
            "Draft outreach you can edit in seconds — every send stays on-brand and compliant with your review habits.",
          ],
          bullets: ["Lead scoring signals", "Smart follow-up suggestions", "Deal-room style collaboration"],
        },
        {
          heading: "Closing automation",
          body: [
            "Connect conversations to documents and signatures so buyers and sellers move forward with clarity.",
          ],
        },
      ],
      ctaLabel: "Explore CRM + AI",
      ctaHref: signup,
      jsonLdType: "SoftwareApplication",
    },
    "tenant-screening-canada": {
      slug: "tenant-screening-canada",
      title: "Tenant screening Canada | Credit verification for landlords & brokers | LECIPM",
      description:
        "Request tenant credit checks, attach results to lease transactions, and satisfy underwriting-style conditions — built for Canadian residential leasing workflows.",
      keywords: [
        "tenant screening Canada",
        "rental credit check",
        "landlord verification",
        "lease compliance",
        "Trustii",
      ],
      hero: "Verify tenants with a structured, attachable credit workflow.",
      sections: [
        {
          heading: "Fewer surprises at lease signing",
          body: [
            "Collect applicant details, trigger verification, and store score plus report links alongside the lease file.",
            "Ideal for brokers coordinating residential rentals and landlords scaling portfolio intake.",
          ],
          bullets: ["Provider-ready integration pattern", "Audit trail on the transaction", "Optional purchase-use guidance"],
        },
        {
          heading: "Risk visibility",
          body: [
            "Pair credit outcomes with compliance checks so low-score applicants trigger review steps — guarantor, additional deposit, or decline — according to your policy.",
          ],
        },
      ],
      ctaLabel: "Enable screening workflow",
      ctaHref: signup,
      jsonLdType: "WebPage",
    },
    "esg-real-estate-platform": {
      slug: "esg-real-estate-platform",
      title: "ESG for real estate platforms | Transparent operations & investor-ready reporting | LECIPM",
      description:
        "Document energy and governance signals alongside deals: give investors and partners a credible narrative backed by structured data — not screenshots.",
      keywords: [
        "ESG real estate",
        "sustainable property platform",
        "investor reporting real estate",
        "green building disclosure",
      ],
      hero: "Operational ESG storytelling that scales with your portfolio.",
      sections: [
        {
          heading: "Why ESG belongs in the transaction layer",
          body: [
            "Buyers and LPs increasingly ask how assets are operated — not only marketed. When ESG signals live next to financial and legal milestones, diligence moves faster.",
          ],
          bullets: ["Centralized milestones", "Export-friendly summaries", "Compatible with mixed portfolios"],
        },
        {
          heading: "Built for growth-stage platforms",
          body: [
            "LECIPM connects growth, billing, and compliance so your team can present an investor-ready operating picture as you scale past 1,000 users toward 10,000+.",
          ],
        },
      ],
      ctaLabel: "See platform ESG hooks",
      ctaHref: signup,
      jsonLdType: "WebPage",
    },
  };
}

export function getSeoLandingDefinition(slug: string, locale: string, country: string): GrowthSeoPageDefinition | null {
  if (!GROWTH_SEO_SLUGS.includes(slug as GrowthSeoSlug)) return null;
  const all = buildSeoLandingDefinitions(locale, country);
  return all[slug as GrowthSeoSlug] ?? null;
}

export function listSeoLandingSlugs(): GrowthSeoSlug[] {
  return [...GROWTH_SEO_SLUGS];
}
