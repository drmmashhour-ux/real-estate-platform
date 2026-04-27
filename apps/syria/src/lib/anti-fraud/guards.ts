import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import type { MarketplaceCategory } from "@/lib/marketplace-categories";

const MS_DAY = 24 * 60 * 60 * 1000;
export const S1_MAX_LISTINGS_PER_PHONE_PER_DAY = 5;

function normalizeTitleLine(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function titlesSimilar(a: string, b: string): boolean {
  const na = normalizeTitleLine(a);
  const nb = normalizeTitleLine(b);
  if (na.length < 4 || nb.length < 4) return false;
  if (na === nb) return true;
  const head = 18;
  if (na.slice(0, head) === nb.slice(0, head) && na.length >= head) return true;
  return false;
}

/**
 * @returns i18n key `AntiFraud.priceWarn*` or null (do not block).
 */
export function getPriceSanityWarningKey(
  category: string,
  priceNum: number,
): "priceWarnGeneric" | "priceWarnStay" | null {
  if (!Number.isFinite(priceNum) || priceNum <= 0) return null;
  if (category === "stay") {
    if (priceNum < 2_000 || priceNum > 2_000_000) return "priceWarnStay";
    return null;
  }
  if (category === "real_estate" || category === "cars" || category === "electronics") {
    if (priceNum < 10_000 || priceNum > 9_000_000_000_000) return "priceWarnGeneric";
  } else {
    if (priceNum < 1_000 || priceNum > 5_000_000_000_000) return "priceWarnGeneric";
  }
  return null;
}

export type AntiFraudGuardResult =
  | { ok: true; priceWarningKey?: "priceWarnGeneric" | "priceWarnStay" }
  | { ok: false; code: "daily_limit" | "duplicate" };

/**
 * Pre-create checks: rate limit, duplicate title (24h, same owner).
 */
export async function runAntiFraudGuardsForPublish(input: {
  ownerId: string;
  titleAr: string;
  priceDec: Prisma.Decimal;
  category: MarketplaceCategory | string;
}): Promise<AntiFraudGuardResult> {
  const since = new Date(Date.now() - MS_DAY);
  const count = await prisma.syriaProperty.count({
    where: { ownerId: input.ownerId, createdAt: { gte: since } },
  });
  if (count >= S1_MAX_LISTINGS_PER_PHONE_PER_DAY) {
    return { ok: false, code: "daily_limit" };
  }

  const recent = await prisma.syriaProperty.findMany({
    where: { ownerId: input.ownerId, createdAt: { gte: since } },
    select: { id: true, titleAr: true },
    take: 30,
  });
  for (const p of recent) {
    if (titlesSimilar(p.titleAr, input.titleAr)) {
      return { ok: false, code: "duplicate" };
    }
  }

  const n = input.priceDec.toNumber();
  const wk = getPriceSanityWarningKey(String(input.category), n);
  return wk ? { ok: true, priceWarningKey: wk } : { ok: true };
}
