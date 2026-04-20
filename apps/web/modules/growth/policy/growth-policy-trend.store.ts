/**
 * Daily observation rollups for trend analysis — separate JSON doc from history rows.
 */

import fs from "fs";
import path from "path";

import type { GrowthPolicyDomain } from "@/modules/growth/policy/growth-policy.types";

/** One UTC calendar day — last evaluation write wins for that day (honest polling cadence). */
export type PolicyTrendDailySnapshot = {
  dateUtc: string;
  updatedAt: string;
  totalFindings: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  recurringCount: number;
  /** Reviews with decision `resolved` submitted this UTC day (activity signal, not proven outcome). */
  resolvedReviewCount: number;
  domainCounts: Partial<Record<GrowthPolicyDomain, number>>;
};

type DocV1 = {
  version: 1;
  updatedAt: string;
  byDay: Record<string, PolicyTrendDailySnapshot>;
};

const memory: { doc: DocV1 } = {
  doc: {
    version: 1,
    updatedAt: new Date().toISOString(),
    byDay: {},
  },
};

let loaded = false;

function defaultPath(): string {
  return path.join(process.cwd(), ".data", "growth-policy-trend-daily.json");
}

function envPath(): string | null {
  const raw = process.env.GROWTH_POLICY_TREND_JSON_PATH?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function resolvedPath(): string {
  return envPath() ?? defaultPath();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function utcDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function resetGrowthPolicyTrendStoreForTests(): void {
  memory.doc = {
    version: 1,
    updatedAt: nowIso(),
    byDay: {},
  };
  loaded = true;
}

function loadFromDisk(): void {
  if (loaded) return;
  loaded = true;
  const fp = resolvedPath();
  if (!fs.existsSync(fp)) return;
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const parsed = JSON.parse(raw) as DocV1;
    if (parsed.version === 1 && parsed.byDay && typeof parsed.updatedAt === "string") {
      memory.doc = parsed;
    }
  } catch {
    /* ignore */
  }
}

function persist(): void {
  const fp = resolvedPath();
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    memory.doc.updatedAt = nowIso();
    fs.writeFileSync(fp, `${JSON.stringify(memory.doc, null, 2)}\n`, "utf8");
  } catch {
    /* read-only */
  }
}

export function getTrendDailyDoc(): DocV1 {
  loadFromDisk();
  return memory.doc;
}

export function upsertTrendDailySnapshot(snapshot: PolicyTrendDailySnapshot): void {
  loadFromDisk();
  memory.doc.byDay[snapshot.dateUtc] = snapshot;
  persist();
}

export function replaceTrendDailyForTests(byDay: Record<string, PolicyTrendDailySnapshot>): void {
  loadFromDisk();
  memory.doc.byDay = { ...byDay };
  persist();
}
