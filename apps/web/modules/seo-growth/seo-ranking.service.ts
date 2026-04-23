import type { SeoContentMetrics, SeoContentPiece, SeoPerformanceSummary } from "./seo.types";
import { resetSeoContentStoreForTests } from "./seo-content.service";

const STORAGE_KEY = "lecipm-seo-growth-metrics-v1";

export type SeoMetricsStore = {
  metrics: Record<string, SeoContentMetrics>;
};

function emptyMetrics(): SeoMetricsStore {
  return { metrics: {} };
}

let memory: SeoMetricsStore = emptyMetrics();

export function loadSeoMetricsStore(): SeoMetricsStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memory = { ...emptyMetrics(), ...JSON.parse(raw) } as SeoMetricsStore;
    } catch {
      /* ignore */
    }
  }
  return memory;
}

export function saveSeoMetricsStore(store: SeoMetricsStore): void {
  memory = store;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* quota */
    }
  }
}

export function resetSeoMetricsStoreForTests(): void {
  memory = emptyMetrics();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

/** Reset keyword/content/metrics persistence for tests */
export function resetAllSeoGrowthStoresForTests(): void {
  resetSeoContentStoreForTests();
  resetSeoMetricsStoreForTests();
}

function ensureMetrics(contentId: string): SeoContentMetrics {
  const store = loadSeoMetricsStore();
  const existing = store.metrics[contentId];
  if (existing) return existing;
  const m: SeoContentMetrics = {
    contentId,
    sessions: 0,
    rankingSamples: 0,
    leadsAttributed: 0,
  };
  store.metrics[contentId] = m;
  saveSeoMetricsStore(store);
  return m;
}

/** Increment session (traffic) count */
export function recordTraffic(contentId: string, sessions = 1): SeoContentMetrics {
  const store = loadSeoMetricsStore();
  const m = ensureMetrics(contentId);
  m.sessions += Math.max(0, sessions);
  store.metrics[contentId] = m;
  saveSeoMetricsStore(store);
  return m;
}

/**
 * Rolling average rank position (lower is better). Pass latest observed position.
 */
export function recordRankingSample(contentId: string, position: number): SeoContentMetrics {
  const store = loadSeoMetricsStore();
  const m = ensureMetrics(contentId);
  const prev = m.avgRankPosition;
  const n = m.rankingSamples;
  const nextN = n + 1;
  m.avgRankPosition =
    prev == null ? position : (prev * n + position) / nextN;
  m.rankingSamples = nextN;
  store.metrics[contentId] = m;
  saveSeoMetricsStore(store);
  return m;
}

export function recordSeoLead(contentId: string, leads = 1): SeoContentMetrics {
  const store = loadSeoMetricsStore();
  const m = ensureMetrics(contentId);
  m.leadsAttributed += Math.max(0, leads);
  store.metrics[contentId] = m;
  saveSeoMetricsStore(store);
  return m;
}

export function getMetrics(contentId: string): SeoContentMetrics | undefined {
  return loadSeoMetricsStore().metrics[contentId];
}

export function buildSeoPerformanceSummary(
  items: SeoContentPiece[],
  metrics: Record<string, SeoContentMetrics>
): SeoPerformanceSummary {
  let totalSessions = 0;
  let totalLeads = 0;
  let rankSum = 0;
  let rankCount = 0;

  for (const item of items) {
    const m = metrics[item.id];
    if (!m) continue;
    totalSessions += m.sessions;
    totalLeads += m.leadsAttributed;
    if (m.avgRankPosition != null && m.rankingSamples > 0) {
      rankSum += m.avgRankPosition;
      rankCount += 1;
    }
  }

  return {
    totalContent: items.length,
    totalSessions,
    avgPosition: rankCount > 0 ? rankSum / rankCount : null,
    totalLeadsFromSeo: totalLeads,
  };
}
