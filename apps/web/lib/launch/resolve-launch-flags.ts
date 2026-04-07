import { prisma } from "@/lib/db";
import { classifyDbError } from "@/lib/db/db-error-classification";
import { launchFlags, type LaunchFlagKey } from "@/config/feature-flags";
import type { LocaleCode } from "@/lib/i18n/types";

export type ResolvedLaunchFlags = typeof launchFlags;

const DB_PREFIX = "launch:";
const LAUNCH_FLAGS_TTL_MS = 30_000;
const LAUNCH_FLAGS_ERROR_TTL_MS = 5_000;
const LAUNCH_FLAGS_CACHE_KEY = "__lecipmResolvedLaunchFlags";

type LaunchFlagsCache = { expires: number; value: ResolvedLaunchFlags };

function readLaunchFlagsCache(): ResolvedLaunchFlags | undefined {
  const g = globalThis as unknown as Record<string, LaunchFlagsCache | undefined>;
  const hit = g[LAUNCH_FLAGS_CACHE_KEY];
  if (hit && hit.expires > Date.now()) return hit.value;
  return undefined;
}

function writeLaunchFlagsCache(value: ResolvedLaunchFlags, ttlMs: number) {
  const g = globalThis as unknown as Record<string, LaunchFlagsCache | undefined>;
  g[LAUNCH_FLAGS_CACHE_KEY] = { expires: Date.now() + ttlMs, value: value };
}

/** Call after mutating `launch:*` feature flags so overrides apply immediately. */
export function clearLaunchFlagsCache() {
  const g = globalThis as unknown as Record<string, LaunchFlagsCache | undefined>;
  delete g[LAUNCH_FLAGS_CACHE_KEY];
}

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
  const cached = readLaunchFlagsCache();
  if (cached) return cached;

  const merged: ResolvedLaunchFlags = { ...launchFlags };
  try {
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
    writeLaunchFlagsCache(merged, LAUNCH_FLAGS_TTL_MS);
  } catch (err) {
    const c = classifyDbError(err);
    console.warn(
      JSON.stringify({
        event: "resolve_launch_flags_db_fallback",
        dbErrorKind: c.kind,
        prismaCode: c.code ?? null,
        messageSummary: c.summary,
      })
    );
    writeLaunchFlagsCache(merged, LAUNCH_FLAGS_ERROR_TTL_MS);
  }
  return merged;
}

export function localeAllowListFromFlags(flags: ResolvedLaunchFlags): LocaleCode[] {
  const out: LocaleCode[] = ["en"];
  if (flags.enableFrench) out.push("fr");
  if (flags.enableArabic) out.push("ar");
  return out;
}
