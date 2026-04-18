import { prisma } from "@/lib/db";

/**
 * Derives min/max guardrails from host autopilot settings and current price — never auto-applies.
 */
export async function computePriceGuardrailsCents(
  hostUserId: string,
  listingNightCents: number,
): Promise<{ minPriceCents: number; maxPriceCents: number }> {
  const settings = await prisma.hostAutopilotSettings.findUnique({
    where: { hostId: hostUserId },
    select: { minPrice: true, maxPrice: true, maxDailyChangePct: true },
  });
  const minUsd = settings?.minPrice != null && settings.minPrice > 0 ? settings.minPrice : null;
  const maxUsd = settings?.maxPrice != null && settings.maxPrice > 0 ? settings.maxPrice : null;
  const pct = settings?.maxDailyChangePct != null && settings.maxDailyChangePct > 0 ? settings.maxDailyChangePct / 100 : 0.15;

  let minCents = minUsd != null ? Math.round(minUsd * 100) : Math.round(listingNightCents * (1 - pct));
  let maxCents = maxUsd != null ? Math.round(maxUsd * 100) : Math.round(listingNightCents * (1 + pct));
  if (minCents > maxCents) [minCents, maxCents] = [maxCents, minCents];
  if (minCents < 0) minCents = 0;
  return { minPriceCents: minCents, maxPriceCents: maxCents };
}
