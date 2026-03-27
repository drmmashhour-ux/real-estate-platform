import type { PrismaClient } from "@prisma/client";
import {
  estimateWelcomeTaxFromConfig,
  parseWelcomeTaxConfigFromDb,
} from "@/lib/tax/welcome-tax";

export async function welcomeTaxForPriceCents(
  prisma: PrismaClient,
  city: string,
  priceCents: number,
  buyerType: string
): Promise<{ slug: string | null; welcomeTaxCents: number }> {
  const active = await prisma.welcomeTaxMunicipalityConfig.findMany({
    where: { active: true },
    select: { slug: true, name: true, bracketsJson: true, rebateRulesJson: true },
  });
  if (active.length === 0) return { slug: null, welcomeTaxCents: 0 };

  const norm = city.trim().toLowerCase();

  let pick = active.find((r) => r.slug === norm.replace(/\s+/g, "-"));
  if (!pick) {
    pick =
      active.find((r) => r.name.toLowerCase().includes(norm.slice(0, Math.min(6, norm.length)))) ??
      active[0];
  }

  const cfg = parseWelcomeTaxConfigFromDb(pick.bracketsJson, pick.rebateRulesJson);
  const est = estimateWelcomeTaxFromConfig(priceCents, buyerType, cfg);
  return { slug: pick.slug, welcomeTaxCents: est.totalCents };
}
