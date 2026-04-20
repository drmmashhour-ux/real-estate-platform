import type { SeoInternalLinkEdge } from "./seo-engine.types";

/**
 * Deterministic internal link graph suggestions for programmatic SEO hubs.
 */
export function buildInternalLinkPlan(homeLocalePath: string): SeoInternalLinkEdge[] {
  const home = homeLocalePath.endsWith("/") ? homeLocalePath.slice(0, -1) : homeLocalePath;
  return [
    {
      sourcePage: `${home}`,
      recommendedTargets: [
        { path: `${home}/listings`, anchorSuggestions: ["Browse listings", "Latest homes"] },
        { path: `${home}/city/montreal`, anchorSuggestions: ["Montreal market", "Explore Montreal"] },
        { path: `${home}/bnhub`, anchorSuggestions: ["BNHub stays", "Short-term rentals"] },
      ],
    },
    {
      sourcePage: `${home}/listings`,
      recommendedTargets: [
        { path: `${home}/projects`, anchorSuggestions: ["New developments", "Projects"] },
        { path: `${home}/investor`, anchorSuggestions: ["Investor hub"] },
        { path: `${home}/blog`, anchorSuggestions: ["Market insights"] },
      ],
    },
    {
      sourcePage: `${home}/bnhub`,
      recommendedTargets: [
        { path: `${home}/bnhub/stays`, anchorSuggestions: ["Search stays", "Where to stay"] },
        { path: `${home}/host/dashboard`, anchorSuggestions: ["Host dashboard"] },
      ],
    },
    {
      sourcePage: `${home}/investor`,
      recommendedTargets: [
        { path: `${home}/evaluate`, anchorSuggestions: ["Evaluate a property"] },
        { path: `${home}/listings`, anchorSuggestions: ["Browse inventory"] },
      ],
    },
    {
      sourcePage: `${home}/residence-services`,
      recommendedTargets: [
        { path: `${home}/support`, anchorSuggestions: ["Help & safety"] },
        { path: `${home}/blog`, anchorSuggestions: ["Guides"] },
      ],
    },
    {
      sourcePage: `${home}/blog`,
      recommendedTargets: [
        { path: `${home}/listings`, anchorSuggestions: ["See listings"] },
        { path: `${home}/city/montreal`, anchorSuggestions: ["City guide"] },
      ],
    },
  ];
}
