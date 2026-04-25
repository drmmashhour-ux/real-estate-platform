import { prisma } from "@/lib/db";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import type { RecommendationRequestContext } from "@/modules/playbook-memory/types/playbook-memory.types";
import type { UserIntelligenceServiceResult, UserPersonalizationContext } from "../types/user-intelligence.types";
import { applySessionOverStored } from "../utils/user-preference-merge";
import { normalizePreferenceRecord } from "../utils/user-preference-normalize";

/**
 * Durable user context for Dream Home, listing score nudges, and playbook requests. Never throws.
 */
export async function buildPersonalizationContext(
  userId: string,
  sessionOverride?: Record<string, unknown> | null,
): Promise<UserIntelligenceServiceResult<UserPersonalizationContext>> {
  try {
    const p = await prisma.userPreferenceProfile.findUnique({ where: { userId } });
    const j = await prisma.userJourneyState.findUnique({ where: { userId } });
    if (!p) {
      return {
        ok: true,
        data: {
          userId,
          hasProfile: false,
          confidence: 0,
          signals: {},
          journey: j
            ? {
                currentDomain: j.currentDomain,
                currentStage: j.currentStage,
                latestCity: j.latestCity,
              }
            : undefined,
          housingPreferences: null,
          designPreferences: null,
          budgetPreferences: null,
          usedWave13Profile: false,
        },
      };
    }
    const h = p.housingPreferences;
    const d = p.designPreferences;
    const b = p.budgetPreferences;
    const houseObj = h && typeof h === "object" && !Array.isArray(h) ? (h as Record<string, unknown>) : null;
    const mergedH = applySessionOverStored(sessionOverride, houseObj);
    const flat: Record<string, string | number | boolean | null> = {
      w13_confidence: p.confidenceScore != null && Number.isFinite(p.confidenceScore) ? p.confidenceScore : null,
    };
    for (const [k, v] of Object.entries(mergedH)) {
      if (v === null || v === undefined) {
        continue;
      }
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        flat[`pref_${k}`] = v;
      }
    }
    if (j?.latestCity) {
      flat.journey_city = j.latestCity;
    }
    if (j?.latestBudgetBand) {
      flat.budget_band = j.latestBudgetBand;
    }
    return {
      ok: true,
      data: {
        userId,
        hasProfile: true,
        confidence: p.confidenceScore != null && Number.isFinite(p.confidenceScore) ? p.confidenceScore : 0.4,
        signals: flat,
        journey: j
          ? { currentDomain: j.currentDomain, currentStage: j.currentStage, latestCity: j.latestCity }
          : undefined,
        housingPreferences: mergedH,
        designPreferences: d as Record<string, unknown> | null,
        budgetPreferences: b as Record<string, unknown> | null,
        usedWave13Profile: true,
      },
    };
  } catch (e) {
    playbookLog.warn("user_intelligence: buildPersonalizationContext", { message: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "context_failed" };
  }
}

/**
 * Merges user personalization into playbook recommendation `signals` when `userId` is present. Additive, non-destructive.
 */
export async function mergePlaybookContextWithUserIntelligence(
  context: RecommendationRequestContext,
): Promise<RecommendationRequestContext> {
  const uid = context.userId;
  if (!uid) {
    return context;
  }
  const res = await buildPersonalizationContext(uid, null);
  if (!res.ok || !res.data.hasProfile) {
    return context;
  }
  const p = res.data;
  const base = (context.signals && typeof context.signals === "object" ? { ...context.signals } : {}) as Record<string, string | number | boolean | null>;
  const merged = normalizePreferenceRecord({ ...p.signals, ...base }) as Record<string, string | number | boolean | null>;
  playbookLog.info("user_intelligence: playbook context merge", { userId: uid, keys: Object.keys(merged).length });
  return { ...context, signals: merged as RecommendationRequestContext["signals"] };
}

/** Resolves a single durable city hint: journey first, then explicit housing, then flattened prefs. */
export function resolvePreferredCityHint(ctx: UserPersonalizationContext | null): string | null {
  if (!ctx) {
    return null;
  }
  const j = ctx.journey?.latestCity?.trim();
  if (j) {
    return j;
  }
  const h = ctx.housingPreferences;
  if (h && typeof h === "object") {
    const o = h as Record<string, unknown>;
    for (const k of ["dream_home_location_city", "location_city", "city"]) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) {
        return v.trim();
      }
    }
  }
  for (const k of ["pref_dream_home_location_city", "pref_location_city", "journey_city"]) {
    const v = ctx.signals[k];
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }
  return null;
}

/**
 * Optional nudge for listing relevance (0-1), never dominant over session filters.
 * Uses journey and/or Wave 13 housing prefs — explicit stored city beats nothing, low weight when profile sparse.
 */
export function personalisationListingNudge(
  base01: number,
  ctx: UserPersonalizationContext | null,
  listingCity: string,
): { score: number; reason: string } {
  if (!ctx) {
    return { score: base01, reason: "no_context" };
  }
  const city = resolvePreferredCityHint(ctx);
  const lc = String(listingCity ?? "").trim();
  if (!city || !lc) {
    return { score: base01, reason: "neutral" };
  }
  if (lc.toLowerCase() === city.toLowerCase()) {
    const conf =
      ctx.usedWave13Profile && ctx.confidence > 0
        ? ctx.confidence
        : ctx.hasProfile
          ? Math.max(0.2, ctx.confidence)
          : 0.25;
    return { score: Math.min(1, base01 + 0.04 * conf), reason: "city_match_durable" };
  }
  return { score: base01, reason: "neutral" };
}

/**
 * Stable re-order: small city-match boost for logged-in users (does not replace filter/sort engines). Never throws.
 */
export async function reorderListingsForWave13Personalization<T extends { city?: string | null }>(
  rows: T[],
  userId: string | null | undefined,
): Promise<T[]> {
  try {
    const uid = userId?.trim();
    if (!uid || rows.length < 2) {
      return rows;
    }
    const res = await buildPersonalizationContext(uid, null);
    if (!res.ok) {
      return rows;
    }
    const ctx = res.data;
    if (!resolvePreferredCityHint(ctx)) {
      return rows;
    }
    const tagged = rows.map((r, i) => {
      const n = personalisationListingNudge(0, ctx, String(r.city ?? ""));
      const boost = n.reason === "city_match_durable" ? 1 : 0;
      return { r, i, boost };
    });
    tagged.sort((a, b) => (b.boost !== a.boost ? b.boost - a.boost : a.i - b.i));
    return tagged.map((x) => x.r);
  } catch (e) {
    playbookLog.warn("user_intelligence: reorderListingsForWave13Personalization", {
      message: e instanceof Error ? e.message : String(e),
    });
    return rows;
  }
}
