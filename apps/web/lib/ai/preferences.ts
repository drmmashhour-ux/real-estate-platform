import { Prisma } from "@prisma/client";
import { clearCache, getCached, CACHE_KEYS } from "@/lib/cache";
import { monolithPrisma } from "@/lib/db";
import { normalize } from "@/lib/ai/searchRelevance";
import { isAllowedPreferenceKey, PREFERENCE_KEY_ALLOWLIST } from "@/lib/ai/preferenceProfile";

const MAX_VAL_LEN = 256;
/** Order 82.1 — cap learned weights to prevent runaway scores. */
export const PREFERENCE_MAX_WEIGHT = 10;
const MAX_SEARCH_QUERY_ROWS = 20;
const PREF_CACHE_TTL_SEC = 60;

const KEY_SET = PREFERENCE_KEY_ALLOWLIST;

/**
 * Additive: increment weight for a (key, value) pair. Keys limited to
 * `city` | `propertyType` | `priceRange` | `searchQuery`; values normalized; weight clamped to {@link PREFERENCE_MAX_WEIGHT}.
 */
export async function updatePreference(userId: string, key: string, value: string): Promise<void> {
  const k = key.trim().toLowerCase().slice(0, 64);
  const v = value.trim().slice(0, MAX_VAL_LEN);
  if (!k || !v) return;
  if (!isAllowedPreferenceKey(k)) return;

  const nv = normalize(v);
  if (!nv) return;

  await monolithPrisma.userPreference.upsert({
    where: {
      userId_key_value: { userId, key: k, value: nv },
    },
    create: { userId, key: k, value: nv, weight: 1 },
    update: { weight: { increment: 1 }, updatedAt: new Date() },
  });

  await monolithPrisma.$executeRaw(Prisma.sql`
    UPDATE "user_preferences"
    SET "weight" = LEAST("weight", ${PREFERENCE_MAX_WEIGHT}::double precision), "updated_at" = NOW()
    WHERE "user_id" = ${userId} AND "key" = ${k} AND "value" = ${nv}
  `);

  if (k === "searchQuery") {
    await trimSearchQueryPreferences(userId);
  }

  clearCache(CACHE_KEYS.prefsUser(userId));
}

export type UserPrefRow = { key: string; value: string; weight: number; updatedAt: Date };

/**
 * Fetches allowlisted `user_preferences` for ranking (60s in-memory cache, Order 82.1).
 */
export async function getPreferences(userId: string): Promise<UserPrefRow[]> {
  return getCached(CACHE_KEYS.prefsUser(userId), PREF_CACHE_TTL_SEC, async () => {
    const rows = await monolithPrisma.userPreference.findMany({
      where: { userId, key: { in: [...KEY_SET] } },
      select: { key: true, value: true, weight: true, updatedAt: true },
    });
    return rows;
  });
}

/**
 * Keep at most {@link MAX_SEARCH_QUERY_ROWS} distinct `searchQuery` rows, dropping oldest by `updatedAt`.
 */
async function trimSearchQueryPreferences(userId: string): Promise<void> {
  const rows = await monolithPrisma.userPreference.findMany({
    where: { userId, key: "searchQuery" },
    orderBy: { updatedAt: "desc" },
    select: { value: true },
  });
  if (rows.length <= MAX_SEARCH_QUERY_ROWS) return;
  const drop = rows.slice(MAX_SEARCH_QUERY_ROWS).map((r) => r.value);
  if (drop.length === 0) return;
  await monolithPrisma.userPreference.deleteMany({
    where: { userId, key: "searchQuery", value: { in: drop } },
  });
  clearCache(CACHE_KEYS.prefsUser(userId));
}

/**
 * Fetches listing fields and records city / property / optional price band for this user.
 * Safe to fire-and-forget from server views; ignores guests (caller checks userId).
 */
export async function recordSearchPreferencesFromListingView(input: {
  userId: string;
  listingId: string;
}): Promise<void> {
  const row = await monolithPrisma.shortTermListing.findFirst({
    where: { id: input.listingId, listingStatus: "PUBLISHED" },
    select: {
      city: true,
      propertyType: true,
      nightPriceCents: true,
    },
  });
  if (!row) return;

  await updatePreference(input.userId, "city", row.city);
  if (row.propertyType) {
    await updatePreference(input.userId, "propertyType", String(row.propertyType));
  }
  if (row.nightPriceCents != null && Number.isFinite(row.nightPriceCents)) {
    const n = await monolithPrisma.shortTermListing.aggregate({
      where: {
        listingStatus: "PUBLISHED",
        city: row.city,
        id: { not: input.listingId },
      },
      _avg: { nightPriceCents: true },
    });
    const peer = n._avg.nightPriceCents;
    if (peer != null && peer > 0) {
      const ratio = row.nightPriceCents / peer;
      const band = ratio < 0.85 ? "low" : ratio > 1.15 ? "high" : "mid";
      await updatePreference(input.userId, "priceRange", band);
    }
  }
}

/**
 * Relevance API: last explicit query (normalized) as a weak preference.
 */
export async function recordSearchQueryPreference(userId: string, q: string): Promise<void> {
  const t = q.trim();
  if (t.length < 2) return;
  await updatePreference(userId, "searchQuery", normalize(t).slice(0, MAX_VAL_LEN));
}

/**
 * Per-user weight decay (call from daily job per user, or use {@link decayAllUserPreferencesWeights} for batch).
 */
export async function decayUserPreferencesWeights(userId: string, factor: number = 0.95): Promise<void> {
  await monolithPrisma.$executeRaw(Prisma.sql`
    UPDATE "user_preferences"
    SET "weight" = LEAST("weight" * ${factor}::double precision, ${PREFERENCE_MAX_WEIGHT}::double precision), "updated_at" = NOW()
    WHERE "user_id" = ${userId}
  `);
  clearCache(CACHE_KEYS.prefsUser(userId));
}

/** Global daily decay; keeps old signal from dominating. */
export async function decayAllUserPreferencesWeights(factor: number = 0.95): Promise<void> {
  await monolithPrisma.$executeRaw(Prisma.sql`
    UPDATE "user_preferences"
    SET "weight" = LEAST("weight" * ${factor}::double precision, ${PREFERENCE_MAX_WEIGHT}::double precision), "updated_at" = NOW()
  `);
  clearCache();
}
