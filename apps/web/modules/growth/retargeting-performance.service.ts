/**
 * Phase-2 hybrid retargeting message performance — in-memory fast path + optional DB hydrate/persist.
 */

import { logWarning } from "@/lib/logger";
import { croRetargetingLearningFlags } from "@/config/feature-flags";
import { listAllRetargetingPerformanceSnapshots, upsertRetargetingPerformance } from "./cro-retargeting-learning.repository";

export type RetargetingPerformance = {
  messageId: string;
  segment: string;
  impressions: number;
  clicks: number;
  bookings: number;
  conversionRate: number;
};

const perf = new Map<string, RetargetingPerformance>();

let hydrated = false;
let hydratePromise: Promise<void> | null = null;
let lastHydratedAt: string | null = null;
let lastPersistedAt: string | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(): void {
  if (!croRetargetingLearningFlags.croRetargetingPersistenceV1) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistRetargetingPerformanceSnapshots();
  }, 2000);
}

export async function hydrateRetargetingPerformanceFromDb(): Promise<void> {
  if (hydrated) return;
  if (!croRetargetingLearningFlags.croRetargetingPersistenceV1) {
    hydrated = true;
    lastHydratedAt = new Date().toISOString();
    return;
  }
  try {
    const rows = await listAllRetargetingPerformanceSnapshots();
    for (const r of rows) {
      mergePerformanceDelta(r.messageId, {
        impressions: r.impressions,
        clicks: r.clicks,
        bookings: r.bookings,
        segment: r.segment,
      });
    }
    lastHydratedAt = new Date().toISOString();
    hydrated = true;
  } catch (e) {
    logWarning("[retargeting-performance] hydrate failed", { err: String(e) });
    hydrated = true;
  }
}

/** Await once before reads when persistence is enabled (SSR / admin). */
export function retargetingPerformanceReady(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydratePromise) return hydratePromise;
  hydratePromise = hydrateRetargetingPerformanceFromDb().finally(() => {
    hydratePromise = null;
  });
  return hydratePromise;
}

export async function persistRetargetingPerformanceSnapshots(): Promise<void> {
  if (!croRetargetingLearningFlags.croRetargetingPersistenceV1) return;
  try {
    const all = snapshotAll();
    if (all.length === 0) return;
    await upsertRetargetingPerformance(
      all.map((p) => ({
        segment: p.segment,
        messageId: p.messageId,
        impressions: p.impressions,
        clicks: p.clicks,
        bookings: p.bookings,
        conversionRate: p.conversionRate,
        evidenceScore: p.clicks > 0 ? p.bookings / p.clicks : null,
        evidenceQuality:
          p.clicks >= 40 ? (p.conversionRate >= 0.05 ? "MEDIUM" : "LOW")
          : p.clicks >= 15 ? "LOW"
          : "LOW",
      })),
    );
    lastPersistedAt = new Date().toISOString();
  } catch (e) {
    logWarning("[retargeting-performance] persist failed", { err: String(e) });
  }
}

export function getRetargetingPerformanceHealth(): {
  hydrated: boolean;
  cacheEntries: number;
  lastHydratedAt?: string | null;
  lastPersistedAt?: string | null;
} {
  return {
    hydrated,
    cacheEntries: perf.size,
    lastHydratedAt,
    lastPersistedAt,
  };
}

export function updatePerformance(row: RetargetingPerformance): void {
  perf.set(row.messageId, { ...row });
  schedulePersist();
}

/** Merge partial counters — used when the same message appears across segments. */
export function mergePerformanceDelta(
  messageId: string,
  delta: Partial<Pick<RetargetingPerformance, "impressions" | "clicks" | "bookings">> & { segment?: string },
): RetargetingPerformance {
  const cur: RetargetingPerformance = perf.get(messageId) ?? {
    messageId,
    segment: delta.segment ?? "visitors",
    impressions: 0,
    clicks: 0,
    bookings: 0,
    conversionRate: 0,
  };
  const next: RetargetingPerformance = {
    ...cur,
    segment: delta.segment ?? cur.segment,
    impressions: cur.impressions + (delta.impressions ?? 0),
    clicks: cur.clicks + (delta.clicks ?? 0),
    bookings: cur.bookings + (delta.bookings ?? 0),
    conversionRate: 0,
  };
  next.conversionRate = next.clicks > 0 ? next.bookings / next.clicks : 0;
  perf.set(messageId, next);
  schedulePersist();
  return next;
}

export function bumpRetargetingBooking(messageId: string, segment?: string): void {
  mergePerformanceDelta(messageId, { bookings: 1, segment });
}

export function recordMessageExposure(messageId: string, segment: string): void {
  mergePerformanceDelta(messageId, { impressions: 1, segment });
}

export function recordMessageClick(messageId: string, segment: string): void {
  mergePerformanceDelta(messageId, { clicks: 1, segment });
}

export async function getTopMessagesBySegment(segment: string, limit = 4): Promise<RetargetingPerformance[]> {
  await retargetingPerformanceReady();
  return [...perf.values()]
    .filter((p) => p.segment === segment && p.clicks >= 1)
    .sort((a, b) => b.conversionRate - a.conversionRate || b.bookings - a.bookings)
    .slice(0, limit);
}

export async function getWeakMessages(segment: string): Promise<RetargetingPerformance[]> {
  await retargetingPerformanceReady();
  return [...perf.values()].filter(
    (p) => p.segment === segment && p.clicks >= 20 && p.conversionRate < 0.02 && p.bookings === 0,
  );
}

export function snapshotAll(): RetargetingPerformance[] {
  return [...perf.values()];
}
