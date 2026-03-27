import { prisma } from "@/lib/db";
import type { PlatformFinancialSettings } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { mergePlatformTaxRegistrationFromEnv } from "@/lib/finance/platform-tax-registration";

const DEFAULT_ID = "default";

/**
 * Loads financial settings and merges platform legal name + GST/QST from env when DB fields are empty.
 * Invoice generation and admin finance reads should use this (not raw Prisma) so secrets in env apply.
 */
export async function getPlatformFinancialSettings(): Promise<PlatformFinancialSettings> {
  const row = await prisma.platformFinancialSettings.findUnique({ where: { id: DEFAULT_ID } });
  const base =
    row ??
    (await prisma.platformFinancialSettings.create({
      data: {
        id: DEFAULT_ID,
        /** Keep in sync with `QUEBEC_GST_RATE` / `QUEBEC_QST_RATE` in `lib/tax/quebec-tax-engine.ts` (invoice line math uses those constants). */
        defaultGstRate: new Prisma.Decimal("0.05"),
        defaultQstRate: new Prisma.Decimal("0.09975"),
        applyTaxToPlatformServices: true,
        applyTaxToBrokerCommissions: true,
      },
    }));
  return mergePlatformTaxRegistrationFromEnv(base);
}

export function decimalToNumber(d: PlatformFinancialSettings["defaultGstRate"]): number {
  return new Prisma.Decimal(d.toString()).toNumber();
}
