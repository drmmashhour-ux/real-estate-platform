/**
 * Market Configuration and Multi-Market Expansion – markets, currency, tax, policy bindings.
 * Used by listings, search, bookings, billing, payouts, policies.
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Get all active markets. */
export async function getActiveMarkets() {
  return prisma.marketConfig.findMany({
    where: { active: true },
    orderBy: { code: "asc" },
  });
}

/** Get market by code. */
export async function getMarketByCode(code: string) {
  return prisma.marketConfig.findUnique({
    where: { code, active: true },
  });
}

/** Get market by id. */
export async function getMarketById(id: string) {
  return prisma.marketConfig.findUnique({
    where: { id },
  });
}

/** Resolve market from listing city/country (simple mapping: city or country as code). */
export async function resolveMarketFromLocation(city?: string, country?: string): Promise<string | null> {
  if (!city && !country) return null;
  const code = (city ?? country ?? "").toUpperCase().replace(/\s+/g, "_").slice(0, 20);
  const market = await prisma.marketConfig.findFirst({
    where: { active: true, OR: [{ code: code }, { code: country ?? "" }, { name: { contains: city ?? "", mode: "insensitive" } }] },
  });
  return market?.id ?? null;
}

/** Get tax rules for market in effect at date. */
export async function getMarketTaxRules(marketId: string, at: Date = new Date()) {
  return prisma.marketTaxRule.findMany({
    where: {
      marketId,
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
    },
  });
}

/** Get policy bindings for market (override or attach policy rules). */
export async function getMarketPolicyBindings(marketId: string) {
  return prisma.marketPolicyBinding.findMany({
    where: { marketId, active: true },
  });
}

/** Create or update market (admin). */
export async function upsertMarket(params: {
  id?: string;
  code: string;
  name: string;
  country: string;
  currency?: string;
  defaultLanguage?: string;
  active?: boolean;
  taxRatePercent?: number;
}) {
  const data = {
    code: params.code,
    name: params.name,
    country: params.country,
    currency: params.currency ?? "USD",
    defaultLanguage: params.defaultLanguage ?? "en",
    active: params.active ?? true,
    taxRatePercent: params.taxRatePercent,
  };
  if (params.id) {
    return prisma.marketConfig.update({
      where: { id: params.id },
      data,
    });
  }
  return prisma.marketConfig.create({
    data,
  });
}

/** Set market active/inactive (launch pause). */
export async function setMarketActive(marketId: string, active: boolean) {
  return prisma.marketConfig.update({
    where: { id: marketId },
    data: { active },
  });
}
