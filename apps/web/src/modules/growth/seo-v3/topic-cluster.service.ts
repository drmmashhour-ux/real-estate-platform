import { growthV3Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

const SEED_CLUSTERS: { slug: string; label: string; cityContains: string }[] = [
  { slug: "montreal-real-estate", label: "Montreal real estate", cityContains: "Montreal" },
  { slug: "investment-properties-montreal", label: "Investment properties Montreal", cityContains: "Montreal" },
  { slug: "bnhub-laval-stays", label: "BNHub Laval stays", cityContains: "Laval" },
];

/**
 * Upserts topical clusters and attaches member SEO slugs from real inventory-backed opportunities.
 */
export async function syncTopicClustersFromOpportunities(): Promise<{ upserts: number }> {
  if (!growthV3Flags.seoAutopilotV3) return { upserts: 0 };

  let upserts = 0;
  for (const c of SEED_CLUSTERS) {
    const members = await prisma.seoPageOpportunity.findMany({
      where: {
        city: { contains: c.cityContains, mode: "insensitive" },
      },
      select: { slug: true },
      take: 80,
    });
    const memberSlugs = members.map((m) => m.slug);
    await prisma.seoTopicCluster.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        label: c.label,
        pillarPageSlug: memberSlugs[0] ?? null,
        memberSlugsJson: memberSlugs,
        status: "candidate",
        metadataJson: { cityContains: c.cityContains, memberCount: memberSlugs.length },
      },
      update: {
        label: c.label,
        pillarPageSlug: memberSlugs[0] ?? null,
        memberSlugsJson: memberSlugs,
        metadataJson: { cityContains: c.cityContains, memberCount: memberSlugs.length },
      },
    });
    upserts += 1;
  }
  return { upserts };
}
