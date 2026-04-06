import { prisma } from "@/lib/db";
import { launchFlags, type LaunchFlagKey } from "@/config/feature-flags";
import type { LocaleCode } from "@/lib/i18n/types";

export type ResolvedLaunchFlags = typeof launchFlags;

const DB_PREFIX = "launch:";

/** Maps DB key suffix (after `launch:`) to LaunchFlagKey */
const LAUNCH_FLAG_DB_KEYS: Record<string, LaunchFlagKey> = {
  enableArabic: "enableArabic",
  enableFrench: "enableFrench",
  enableSyriaMarket: "enableSyriaMarket",
  enableManualBookings: "enableManualBookings",
  enableManualPayments: "enableManualPayments",
  enableContactFirstUx: "enableContactFirstUx",
  enableAiContentEngine: "enableAiContentEngine",
  enableAiContentPublish: "enableAiContentPublish",
  enablePublicCityPages: "enablePublicCityPages",
  enableMobileBookings: "enableMobileBookings",
};

/**
 * Env-backed defaults merged with optional DB overrides (`featureFlag` rows keyed `launch:enableArabic`, etc.).
 * When a DB row exists, its `enabled` value replaces the env-derived boolean for that key.
 */
export async function resolveLaunchFlags(): Promise<ResolvedLaunchFlags> {
  const merged: ResolvedLaunchFlags = { ...launchFlags };
  const rows = await prisma.featureFlag.findMany({
    where: { key: { startsWith: DB_PREFIX } },
    select: { key: true, enabled: true },
  });
  for (const row of rows) {
    const suffix = row.key.slice(DB_PREFIX.length) as keyof typeof LAUNCH_FLAG_DB_KEYS;
    const flagKey = LAUNCH_FLAG_DB_KEYS[suffix];
    if (flagKey) {
      (merged as Record<LaunchFlagKey, boolean>)[flagKey] = row.enabled;
    }
  }
  return merged;
}

export function localeAllowListFromFlags(flags: ResolvedLaunchFlags): LocaleCode[] {
  const out: LocaleCode[] = ["en"];
  if (flags.enableFrench) out.push("fr");
  if (flags.enableArabic) out.push("ar");
  return out;
}
