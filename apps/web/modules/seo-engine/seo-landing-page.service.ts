import type { SeoLandingPageKind, SeoLandingPageSuggestion } from "./seo-engine.types";

function slug(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/gi, "");
}

const REVIEW_LINE =
  "Review in Marketing Hub before publish — avoid thin or duplicate pages; add local proof and unique copy.";

/**
 * Suggests indexable landing page patterns (not auto-published).
 */
export function buildLandingPageSuggestion(
  kind: SeoLandingPageKind,
  city: string,
  options?: { propertyType?: string; neighborhood?: string }
): SeoLandingPageSuggestion {
  const c = city.trim() || "montreal";
  const s = slug(c);
  const pt = options?.propertyType?.trim() || "condos";
  const nb = options?.neighborhood?.trim();

  if (kind === "city_property_type") {
    return {
      kind,
      routeSuggestion: `/${s}/${pt.replace(/\s+/g, "-")}`,
      title: `${pt} in ${c} | LECIPM Search`,
      h1: `Find ${pt} in ${c}`,
      introParagraph: `Discover ${pt} across ${c} on LECIPM — map-based search, transparent details, and broker tools. ${REVIEW_LINE}`,
      supportingSectionIdeas: [
        "Neighborhood comparison (transit, schools, walkability) without unverifiable claims",
        "How to shortlist and book a visit",
        "Financing and next steps (general information only)",
      ],
      internalLinkTargets: ["/listings", `/city/${s}`, "/projects"],
    };
  }

  if (kind === "city_luxury") {
    return {
      kind,
      routeSuggestion: `/${s}/luxury-homes`,
      title: `Luxury homes in ${c} | LECIPM`,
      h1: `Luxury real estate in ${c}`,
      introParagraph: `A premium entry point for high-end inventory in ${c}. Listings change frequently; LECIPM does not guarantee availability. ${REVIEW_LINE}`,
      supportingSectionIdeas: [
        "What “luxury” means in this market (finishes, service, location context)",
        "Concierge and private showing flow",
        "Link to vetted luxury specialists",
      ],
      internalLinkTargets: ["/listings", "/evaluate", `/city/${s}`],
    };
  }

  if (kind === "city_stays") {
    const path = nb
      ? `/${slug(nb)}/stays`
      : `/${s}/stays`;
    return {
      kind,
      routeSuggestion: path,
      title: `Short-term stays in ${nb ? `${nb}, ` : ""}${c} | LECIPM BNHub`,
      h1: `Stays in ${nb ? `${nb} · ` : ""}${c}`,
      introParagraph: `Explore BNHub short-term stays with clear pricing and host rules. Availability is host-dependent. ${REVIEW_LINE}`,
      supportingSectionIdeas: [
        "Neighborhood guide (factual, date-stamped when possible)",
        "How booking and trust & safety work on LECIPM",
        "Seasonal demand context (no revenue promises)",
      ],
      internalLinkTargets: ["/bnhub", "/bnhub/stays", "/listings"],
    };
  }

  if (kind === "city_investor") {
    return {
      kind,
      routeSuggestion: `/${s}/investment-insights`,
      title: `Investment properties & market context — ${c} | LECIPM`,
      h1: `Investment insights for ${c}`,
      introParagraph: `Educational overview for investors researching ${c}: data-informed context and platform workflows — not personalized investment advice. ${REVIEW_LINE}`,
      supportingSectionIdeas: [
        "Rent vs. buy framing (informational)",
        "Due diligence checklist",
        "Link to investor workspace / opportunities where enabled",
      ],
      internalLinkTargets: ["/investor", `/city/${s}`, "/blog"],
    };
  }

  return {
    kind: "city_residence_services",
    routeSuggestion: `/${s}/residence-services`,
    title: `Residence services in ${c} | LECIPM`,
    h1: `Residence services coordination in ${c}`,
    introParagraph: `LECIPM connects families with residence listings and service coordination options. Services are operated by residences — not healthcare or monitoring by LECIPM. ${REVIEW_LINE}`,
    supportingSectionIdeas: [
      "What to ask on a tour (services, billing, communication)",
      "Family permissions and alerts (operational only)",
      "Link to residence-services hub",
    ],
    internalLinkTargets: ["/residence-services", "/blog", "/support"],
  };
}

export function listLandingPageCandidates(city: string, neighborhood?: string): SeoLandingPageSuggestion[] {
  const kinds: SeoLandingPageKind[] = [
    "city_property_type",
    "city_luxury",
    "city_stays",
    "city_investor",
    "city_residence_services",
  ];
  return kinds.map((k) => buildLandingPageSuggestion(k, city, { neighborhood }));
}
