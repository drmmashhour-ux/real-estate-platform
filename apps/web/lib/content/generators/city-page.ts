import type { CreateGeneratedContentDraftInput } from "../dao";
import type { GenerateContentInput, MarketContentConstraints } from "../types";
import { buildMarketConstraintAppendix, cityPageSystemPreamble } from "../templates";
import { translateServer } from "@/lib/i18n/server-translate";

function citySlug(entity: Record<string, unknown>): string | null {
  const s = entity.citySlug ?? entity.slug;
  return typeof s === "string" ? s : null;
}

/** Programmatic city / neighborhood landing scaffold (H1, intro, FAQ, SEO). */
export function buildCityLandingDraft(
  input: GenerateContentInput,
  constraints: MarketContentConstraints,
): CreateGeneratedContentDraftInput {
  const isNeighborhood = input.surface === "neighborhood_landing_page";
  const place = String(input.entity.cityName ?? input.entity.city ?? input.entity.name ?? "City");
  const slug = citySlug(input.entity);

  const h1 = isNeighborhood
    ? translateServer(input.locale, "contentEngine.template.neighborhoodH1", { place })
    : translateServer(input.locale, "contentEngine.template.cityH1", { place });

  const heroSubtitle = translateServer(input.locale, "contentEngine.template.cityHeroSubtitle");
  const intro = translateServer(input.locale, "contentEngine.template.cityIntro");
  const faqQ = translateServer(input.locale, "contentEngine.template.cityFaqQ1");
  const faqA = translateServer(input.locale, "contentEngine.template.cityFaqA1");

  const body = [
    cityPageSystemPreamble(input.locale),
    "",
    `# ${h1}`,
    "",
    `## ${heroSubtitle}`,
    intro,
    "",
    "## FAQ",
    `**${faqQ}** ${faqA}`,
    "",
    buildMarketConstraintAppendix(input.locale, constraints),
  ].join("\n\n");

  const seoTitle = `${h1}`.slice(0, 60);
  const seoDescription = intro.slice(0, 160);

  return {
    surface: isNeighborhood ? "neighborhood_landing_page" : "city_landing_page",
    locale: input.locale,
    marketCode: constraints.marketCode,
    entityType: "city",
    entityId: slug,
    title: h1,
    body,
    summary: intro.slice(0, 280),
    seoTitle,
    seoDescription,
    generationSource: "template",
    createdBySystem: true,
    metadata: {
      structured: { h1, heroSubtitle, faq: [{ q: faqQ, a: faqA }] },
      generator: "city-page",
    },
    statusOverride: "draft",
  };
}
