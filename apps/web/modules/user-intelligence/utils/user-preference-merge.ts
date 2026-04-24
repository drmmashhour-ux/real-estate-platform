import type { Prisma } from "@prisma/client";
import { normalizePreferenceRecord, safeSignalValue } from "./user-preference-normalize";
import type { UserPreferenceMergeResult } from "../types/user-intelligence.types";

const EXPLICIT_W = 1.6;
const BEHAV_W = 0.45;
const STALE_DAYS = 400;

type SignalRow = {
  signalKey: string;
  signalValueJson: Prisma.JsonValue;
  signalWeight: number | null;
  confidence: number | null;
  explicitUserProvided: boolean;
  derivedFromBehavior: boolean;
  lastObservedAt: Date | null;
  createdAt: Date;
};

/**
 * Merges signals into per-category profile JSON. Explicit outranks weak behavioral rows.
 */
export function mergeSignalsToProfile(rows: SignalRow[], _opts?: { now?: Date }): UserPreferenceMergeResult {
  const now = _opts?.now ?? new Date();
  const housing: Record<string, unknown> = {};
  const lifestyle: Record<string, unknown> = {};
  const neigh: Record<string, unknown> = {};
  const budget: Record<string, unknown> = {};
  const a11: Record<string, unknown> = {};
  const design: Record<string, unknown> = {};
  const house: Record<string, unknown> = {};
  let wSum = 0;
  let wCount = 0;
  for (const r of rows) {
    const st = (r.lastObservedAt ?? r.createdAt).getTime();
    if (r.derivedFromBehavior && st < now.getTime() - STALE_DAYS * 86_400_000) {
      continue;
    }
    const wBase = r.explicitUserProvided ? EXPLICIT_W : r.derivedFromBehavior ? BEHAV_W : 0.9;
    const w = wBase * (r.signalWeight == null || !Number.isFinite(r.signalWeight) ? 1 : r.signalWeight) * (r.confidence == null || !Number.isFinite(r.confidence) ? 0.75 : 0.5 + 0.5 * r.confidence);
    const v = safeSignalValue(r.signalValueJson);
    if (v == null) {
      continue;
    }
    wSum += w;
    wCount += 1;
    if (r.signalKey.startsWith("household_") || r.signalKey === "family_size_band") {
      house[r.signalKey] = v;
    } else if (r.signalKey.startsWith("housing_") || r.signalKey.includes("bedroom") || r.signalKey === "wfh") {
      housing[r.signalKey] = v;
    } else if (r.signalKey.startsWith("lifestyle_") || r.signalKey.includes("hosting") || r.signalKey.includes("privacy")) {
      lifestyle[r.signalKey] = v;
    } else if (r.signalKey.startsWith("neigh") || r.signalKey.startsWith("city_") || r.signalKey === "location_city") {
      neigh[r.signalKey] = v;
    } else if (r.signalKey.startsWith("budget_")) {
      budget[r.signalKey] = v;
    } else if (r.signalKey.startsWith("accessib") || r.signalKey === "a11y") {
      a11[r.signalKey] = v;
    } else if (r.signalKey.startsWith("style_") || r.signalKey.startsWith("design_")) {
      design[r.signalKey] = v;
    } else {
      housing[r.signalKey] = v;
    }
  }
  const conf = wCount > 0 ? Math.min(1, wSum / (wCount * 2)) : 0;
  return {
    householdProfile: Object.keys(house).length ? normalizePreferenceRecord(house) : null,
    housingPreferences: Object.keys(housing).length ? normalizePreferenceRecord(housing) : null,
    lifestylePreferences: Object.keys(lifestyle).length ? normalizePreferenceRecord(lifestyle) : null,
    neighborhoodPreferences: Object.keys(neigh).length ? normalizePreferenceRecord(neigh) : null,
    budgetPreferences: Object.keys(budget).length ? normalizePreferenceRecord(budget) : null,
    accessibilityPreferences: Object.keys(a11).length ? normalizePreferenceRecord(a11) : null,
    designPreferences: Object.keys(design).length ? normalizePreferenceRecord(design) : null,
    confidence: conf,
  };
}

export function applySessionOverStored<T extends Record<string, unknown> | null>(
  session: Record<string, unknown> | null | undefined,
  stored: T,
): T extends null ? Record<string, unknown> : T & Record<string, unknown> {
  const a = (stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {}) as Record<string, unknown>;
  const s = session && typeof session === "object" ? normalizePreferenceRecord(session) : {};
  return normalizePreferenceRecord({ ...a, ...s }) as T extends null ? Record<string, unknown> : T & Record<string, unknown>;
}
