/**
 * Platform GST/QST / legal name resolution (server-side only).
 *
 * - Prefer values stored in `PlatformFinancialSettings` (admin UI / DB).
 * - Fall back to environment variables when DB fields are empty (secrets in vault / hosting env).
 * - Never use `NEXT_PUBLIC_*` for registration numbers — they would leak to the browser bundle.
 *
 * Used for invoice generation and authenticated admin finance APIs — not for anonymous public routes.
 */

import type { PlatformFinancialSettings } from "@prisma/client";

function trimOrNull(v: string | null | undefined): string | null {
  const t = typeof v === "string" ? v.trim() : "";
  return t.length > 0 ? t : null;
}

/** Registration numbers from environment only (no DB). */
export function getPlatformTaxRegistrationFromEnvironment(): Pick<
  PlatformFinancialSettings,
  "legalName" | "platformGstNumber" | "platformQstNumber"
> {
  return {
    legalName: trimOrNull(process.env.PLATFORM_LEGAL_NAME),
    platformGstNumber: trimOrNull(process.env.PLATFORM_GST_NUMBER),
    platformQstNumber: trimOrNull(process.env.PLATFORM_QST_NUMBER),
  };
}

/**
 * Merge DB row with env fallbacks so invoices always prefer configured DB values,
 * but production can supply numbers via secrets manager without writing to DB.
 */
export function mergePlatformTaxRegistrationFromEnv(
  row: PlatformFinancialSettings
): PlatformFinancialSettings {
  const env = getPlatformTaxRegistrationFromEnvironment();
  return {
    ...row,
    legalName: trimOrNull(row.legalName) ?? env.legalName,
    platformGstNumber: trimOrNull(row.platformGstNumber) ?? env.platformGstNumber,
    platformQstNumber: trimOrNull(row.platformQstNumber) ?? env.platformQstNumber,
  };
}
