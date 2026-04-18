import { growthV3Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

/**
 * Suggests internal links between SEO pages in the same city — persisted as suggestions for editorial review.
 */
export async function generateInternalLinkSuggestions(limitPairs = 120): Promise<{ inserted: number }> {
  if (!growthV3Flags.seoAutopilotV3) return { inserted: 0 };

  const opps = await prisma.seoPageOpportunity.findMany({
    where: { city: { not: null } },
    select: { slug: true, city: true },
    take: 200,
    orderBy: { opportunityScore: "desc" },
  });

  const byCity = new Map<string, string[]>();
  for (const o of opps) {
    const city = (o.city ?? "").trim();
    if (!city) continue;
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city)!.push(o.slug);
  }

  let inserted = 0;
  outer: for (const [, slugs] of byCity) {
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i + 1; j < slugs.length && inserted < limitPairs; j++) {
        const source = slugs[i];
        const target = slugs[j];
        const exists = await prisma.seoInternalLinkSuggestion.findFirst({
          where: {
            sourceSlug: source,
            targetSlug: target,
          },
        });
        if (exists) continue;
        await prisma.seoInternalLinkSuggestion.create({
          data: {
            sourceSlug: source,
            targetSlug: target,
            suggestionType: "same_city",
            status: "suggested",
            metadataJson: { reason: "city_cluster" },
          },
        });
        inserted += 1;
        if (inserted >= limitPairs) break outer;
      }
    }
  }

  return { inserted };
}
