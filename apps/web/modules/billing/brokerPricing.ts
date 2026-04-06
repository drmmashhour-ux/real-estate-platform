import type { PrismaClient } from "@prisma/client";

function parseEnvFloat(v: string | undefined, fallback: number): number {
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Default unit price (CAD dollars) when a broker has no profile row yet. */
export const DEFAULT_BROKER_LEAD_PRICE = parseEnvFloat(
  process.env.BROKER_ASSIGNED_LEAD_DEFAULT_PRICE,
  100
);

export async function getOrCreateBrokerMonetizationProfile(db: PrismaClient, brokerId: string) {
  return db.brokerMonetizationProfile.upsert({
    where: { brokerId },
    create: { brokerId },
    update: {},
  });
}

/** Effective price for one assigned lead (per-broker `leadPrice` on profile, schema default 100). */
export async function getBrokerLeadUnitPrice(db: PrismaClient, brokerId: string): Promise<number> {
  const p = await getOrCreateBrokerMonetizationProfile(db, brokerId);
  return p.leadPrice;
}
