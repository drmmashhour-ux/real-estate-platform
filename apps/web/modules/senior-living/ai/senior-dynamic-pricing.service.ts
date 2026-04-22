import { prisma } from "@/lib/db";
import { logSeniorAi } from "@/lib/senior-ai/log";

export type PricingContext = {
  city?: string | null;
  leadQualityScore?: number;
  conversionProbability?: number;
};

/** Clamp + smooth — prevents sudden jumps for operators. */
export async function computeFinalLeadPriceCents(ctx: PricingContext): Promise<{
  priceCents: number;
  explanation: string;
}> {
  const rule = await prisma.seniorPricingRule.findFirst({
    where: ctx.city ? { city: { equals: ctx.city, mode: "insensitive" } } : undefined,
    orderBy: { updatedAt: "desc" },
  });

  const base = rule?.leadBasePrice ?? 49;
  const minP = rule?.minPrice ?? 29;
  const maxP = rule?.maxPrice ?? 199;
  const demand = rule?.demandFactor ?? 1;
  const quality = rule?.qualityFactor ?? 1;

  const q = ctx.leadQualityScore ?? 55;
  const conv = ctx.conversionProbability ?? 0.35;
  const qualityBump = 0.85 + (q / 100) * 0.25;
  const convBump = 0.9 + conv * 0.2;

  let price = base * demand * quality * qualityBump * convBump;
  price = Math.max(minP, Math.min(maxP, price));
  price = Math.round(price * 100) / 100;

  logSeniorAi("[senior-pricing]", "compute", { city: ctx.city ?? "", price });

  return {
    priceCents: Math.round(price * 100),
    explanation:
      q >= 70 ?
        "This request is priced higher because it is a stronger match and more likely to convert."
      : "This request uses the standard range for your area.",
  };
}
