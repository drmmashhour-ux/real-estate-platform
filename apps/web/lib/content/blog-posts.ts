/**
 * SEO blog posts — static content with internal links to growth landings and product URLs.
 */

export type BlogSection = {
  heading: string;
  /** Safe HTML-free paragraphs; rendered as <p> */
  paragraphs: string[];
  /** Internal hrefs */
  links?: Array<{ href: string; label: string }>;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedIso: string;
  author: string;
  keywords: string[];
  sections: BlogSection[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "buying-in-montreal-guide",
    title: "Buying in Montreal in 2026: neighbourhood context & next steps",
    description:
      "What buyers should know about Montreal’s market, FSBO options, and how to start with LECIPM — with links to city pages and tools.",
    publishedIso: "2026-01-10",
    author: "LECIPM Editorial",
    keywords: ["buy Montreal", "Montreal real estate 2026", "FSBO Montreal", "home buyer guide"],
    sections: [
      {
        heading: "Why Montreal still attracts buyers",
        paragraphs: [
          "Montreal combines relative affordability within Canada, strong rental demand, and a diversified economy. Buyers often weigh commute, language of schooling, and borough-specific bylaws before they shortlist.",
          "Start with a realistic budget range and a timeline. Pre-approval or a mortgage conversation early keeps offers credible — especially when inventory is tight.",
        ],
        links: [
          { href: "/buy/montreal", label: "Browse our Montreal “buy” SEO hub" },
          { href: "/mortgage/montreal", label: "Mortgage & pre-approval in Montreal" },
        ],
      },
      {
        heading: "FSBO vs broker-assisted purchases",
        paragraphs: [
          "FSBO listings can offer direct negotiation with sellers. Many buyers still involve a notary and may consult a broker or lawyer for paperwork — choose what matches your risk tolerance.",
          "On LECIPM you can explore FSBO inventory and complementary services without losing transparency.",
        ],
        links: [
          { href: "/sell", label: "Explore FSBO listings" },
          { href: "/evaluate", label: "Free property evaluation tool" },
        ],
      },
      {
        heading: "Checklist before you offer",
        paragraphs: [
          "Review last municipal assessment, condo contingency fund (if applicable), and inclusions/exclusions. Schedule inspections where needed and confirm financing conditions in your promise to purchase.",
        ],
        links: [{ href: "/blog/rent-prices-laval-2026", label: "Compare rental pressure in nearby Laval" }],
      },
    ],
  },
  {
    slug: "rent-prices-laval-2026",
    title: "Rent prices in Laval 2026 — trends for tenants & hosts",
    description:
      "Snapshot of rent dynamics around Laval, what travelers pay on short-term channels, and how BNHub fits your search.",
    publishedIso: "2026-01-14",
    author: "LECIPM Editorial",
    keywords: ["Laval rent 2026", "Laval rental market", "short-term rental Laval"],
    sections: [
      {
        heading: "Long-term vs short-term demand",
        paragraphs: [
          "Laval benefits from proximity to Montreal job centres while offering suburban space. Long-term rents react to interest rates and immigration; short-term rates track events, graduation seasons, and tourism spillovers.",
          "If you are visiting or between leases, short-term inventory can bridge gaps without long commitments — compare total stay cost including cleaning fees.",
        ],
        links: [
          { href: "/rent/laval", label: "Rent & stays hub — Laval" },
          { href: "/search/bnhub?location=laval", label: "Open BNHub search for Laval" },
        ],
      },
      {
        heading: "How to benchmark a listing",
        paragraphs: [
          "Look at nightly rate, minimum nights, cancellation policy, and total price after taxes and platform fees. Photos and host responsiveness are strong quality signals.",
        ],
        links: [{ href: "/bnhub", label: "Discover BNHub" }],
      },
    ],
  },
  {
    slug: "mortgage-tips-quebec",
    title: "Mortgage tips for Quebec buyers",
    description:
      "Pre-approval, documentation, and working with a mortgage expert on LECIPM — optimized for Québec buyers.",
    publishedIso: "2026-01-18",
    author: "LECIPM Editorial",
    keywords: ["mortgage Quebec", "pre-approval Quebec", "Quebec home financing"],
    sections: [
      {
        heading: "Pre-approval first",
        paragraphs: [
          "A pre-approval narrows your price range and speeds up offers. Experts on our platform can outline realistic payments including taxes and notary costs.",
        ],
        links: [
          { href: "/mortgage/quebec", label: "Mortgage SEO hub — Quebec City" },
          { href: "/mortgage", label: "Mortgage product page" },
        ],
      },
      {
        heading: "Documents to gather",
        paragraphs: [
          "Expect to provide identification, proof of income, liabilities, and down payment source. Self-employed borrowers may need additional statements — your expert will tailor the list.",
        ],
        links: [{ href: "/experts", label: "Talk to a mortgage expert" }],
      },
      {
        heading: "Stress test & budgeting",
        paragraphs: [
          "Budget for closing costs, moving, and a buffer after closing. Rates can change — build comfort below your absolute maximum payment.",
        ],
        links: [{ href: "/buy/quebec", label: "Buying hub — Quebec City region" }],
      },
    ],
  },
  {
    slug: "lecipm-growth-platform-overview",
    title: "LECIPM in one page: AI trust, BNHub, and broker CRM",
    description:
      "How the platform fits together for buyers, hosts, and brokers — with links to listings, stays, and signup.",
    publishedIso: "2026-03-28",
    author: "LECIPM Growth",
    keywords: ["LECIPM", "real estate platform Quebec", "BNHub", "real estate CRM"],
    sections: [
      {
        heading: "Why one stack",
        paragraphs: [
          "Fragmented tools hide risk: spreadsheets for comps, inboxes for leads, and ad-hoc messages for short-term guests. LECIPM keeps trust signals, inventory, and pipeline context closer together.",
          "You can start as a browser, host, or professional — the same identity layer powers deeper features when you upgrade.",
        ],
        links: [
          { href: "/", label: "Marketing home" },
          { href: "/auth/signup", label: "Create an account" },
        ],
      },
      {
        heading: "AI without the black box",
        paragraphs: [
          "Deal and trust summaries are designed to be explainable: what was checked, what is missing, and what to verify next with a notary or broker.",
        ],
        links: [{ href: "/evaluate", label: "Try the evaluation flow" }],
      },
      {
        heading: "BNHub + CRM",
        paragraphs: [
          "BNHub focuses on short-term inventory and bookings; CRM lanes prioritize broker and team workflows. Together they reduce duplicate data entry for hybrid operators.",
        ],
        links: [
          { href: "/bnhub", label: "Explore BNHub" },
          { href: "/listings", label: "Browse resale listings" },
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}
