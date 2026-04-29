"use client";

export type SeoCityTelemetry = {
  views: Record<string, { count: number; lastAt: string }>;
  clicks: Record<string, { count: number; lastAt: string }>;
  leads: Record<string, { count: number; lastAt: string }>;
};

const TELEMETRY_KEY = "lecipm-seo-city-telemetry-v1";

let telMem: SeoCityTelemetry = { views: {}, clicks: {}, leads: {} };

function loadTel(): SeoCityTelemetry {
  if (typeof localStorage !== "undefined") {
    try {
      const r = localStorage.getItem(TELEMETRY_KEY);
      if (r) telMem = { ...telMem, ...JSON.parse(r) } as SeoCityTelemetry;
    } catch {
      /* ignore */
    }
  }
  return telMem;
}

function saveTel(t: SeoCityTelemetry) {
  telMem = t;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(TELEMETRY_KEY, JSON.stringify(t));
    } catch {
      /* quota */
    }
  }
}

export function resetSeoCityTelemetryForTests(): void {
  telMem = { views: {}, clicks: {}, leads: {} };
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(TELEMETRY_KEY);
    } catch {
      /* noop */
    }
  }
}

/** Client-side: record page view for admin dashboards (best-effort). */
export function recordSeoCityPageView(path: string): void {
  if (typeof window === "undefined") return;
  const t = loadTel();
  const prev = t.views[path] ?? { count: 0, lastAt: new Date().toISOString() };
  t.views[path] = { count: prev.count + 1, lastAt: new Date().toISOString() };
  saveTel(t);
}

export function getSeoCityTelemetry(): SeoCityTelemetry {
  return loadTel();
}
