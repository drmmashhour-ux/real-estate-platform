/**
 * File-backed store for the First 10 broker list. Optional env: `FIRST_10_QUEBEC_BROKERS_JSON` (absolute or cwd-relative).
 */

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type {
  FirstQuebecBrokerRow,
  FirstQuebecCity,
  FirstQuebecResponseLevel,
  FirstQuebecSource,
  FirstQuebecStage,
  FirstQuebecSummary,
} from "./first-ten-quebec.types";
export { FIRST_10_TARGET } from "./first-ten-quebec.types";

const MAX_ROWS = 500;

function dataPath(): string {
  const raw = process.env.FIRST_10_QUEBEC_BROKERS_JSON?.trim();
  if (raw) return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
  return path.join(process.cwd(), ".data", "first-ten-quebec-brokers.json");
}

const store: Map<string, FirstQuebecBrokerRow> = new Map();
let loaded = false;

const STAGES: FirstQuebecStage[] = [
  "found",
  "contacted",
  "demo_booked",
  "demo_done",
  "trial",
  "paid",
];

function normalizeRow(raw: unknown): FirstQuebecBrokerRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  if (!id) return null;
  const city = r.city;
  const source = r.source;
  if (city !== "montreal" && city !== "laval") return null;
  if (source !== "facebook" && source !== "instagram" && source !== "google") return null;
  if (!STAGES.includes(r.stage as FirstQuebecStage)) return null;
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (name.length < 1) return null;

  return {
    id,
    name,
    phone: typeof r.phone === "string" ? r.phone : "",
    email: typeof r.email === "string" ? r.email : "",
    city,
    source: source as FirstQuebecSource,
    targetIndependent: r.targetIndependent === true,
    targetUnderFiveYears: r.targetUnderFiveYears === true,
    targetSocialActive: r.targetSocialActive === true,
    targetSmallTeam: r.targetSmallTeam === true,
    activityScore: clampInt(r.activityScore, 1, 5, 3),
    responseLevel: normalizeResponse(r.responseLevel),
    stage: r.stage as FirstQuebecStage,
    notes: typeof r.notes === "string" ? r.notes : "",
    lastContactAt: r.lastContactAt === null || typeof r.lastContactAt === "string" ? (r.lastContactAt as string | null) : null,
    nextFollowUpAt:
      r.nextFollowUpAt === null || typeof r.nextFollowUpAt === "string" ? (r.nextFollowUpAt as string | null) : null,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : new Date().toISOString(),
  };
}

function clampInt(v: unknown, min: number, max: number, d: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return d;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function normalizeResponse(v: unknown): FirstQuebecResponseLevel {
  if (v === "none" || v === "low" || v === "med" || v === "high") return v;
  return "none";
}

function load(): void {
  if (loaded) return;
  loaded = true;
  const fp = dataPath();
  if (!fs.existsSync(fp)) return;
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return;
    for (const row of arr) {
      const n = normalizeRow(row);
      if (n) store.set(n.id, n);
    }
  } catch {
    /* ignore */
  }
}

function persist(): void {
  const fp = dataPath();
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const list = sortForDisplay([...store.values()]);
    fs.writeFileSync(fp, JSON.stringify(list, null, 2), "utf8");
  } catch {
    /* read-only in some envs */
  }
}

function responseWeight(r: FirstQuebecResponseLevel): number {
  switch (r) {
    case "high":
      return 4;
    case "med":
      return 3;
    case "low":
      return 2;
    case "none":
    default:
      return 0;
  }
}

/** Activity desc, then response desc */
export function sortForDisplay(rows: FirstQuebecBrokerRow[]): FirstQuebecBrokerRow[] {
  return [...rows].sort((a, b) => {
    if (b.activityScore !== a.activityScore) return b.activityScore - a.activityScore;
    return responseWeight(b.responseLevel) - responseWeight(a.responseLevel);
  });
}

export function listFirstQuebecBrokers(): FirstQuebecBrokerRow[] {
  load();
  return sortForDisplay([...store.values()]);
}

export function getFirstQuebecSummary(): FirstQuebecSummary {
  const rows = listFirstQuebecBrokers();
  const byStage = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<FirstQuebecStage, number>;
  for (const r of rows) {
    byStage[r.stage] = (byStage[r.stage] ?? 0) + 1;
  }
  const demosBooked = byStage.demo_booked;
  const conversionsPipeline = byStage.demo_done + byStage.trial;
  return {
    total: rows.length,
    byStage,
    demosBooked,
    conversionsPipeline,
    paid: byStage.paid,
  };
}

export type AddFirstQuebecInput = {
  name: string;
  phone: string;
  email: string;
  city: FirstQuebecCity;
  source: FirstQuebecSource;
  targetIndependent: boolean;
  targetUnderFiveYears: boolean;
  targetSocialActive: boolean;
  targetSmallTeam: boolean;
  activityScore: number;
  responseLevel: FirstQuebecResponseLevel;
  notes?: string;
};

export function addFirstQuebecBroker(input: AddFirstQuebecInput): { ok: true; row: FirstQuebecBrokerRow } | { ok: false; error: string } {
  load();
  if (store.size >= MAX_ROWS) return { ok: false, error: "MAX_ROWS" };
  const now = new Date().toISOString();
  const row: FirstQuebecBrokerRow = {
    id: randomUUID(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    city: input.city,
    source: input.source,
    targetIndependent: input.targetIndependent,
    targetUnderFiveYears: input.targetUnderFiveYears,
    targetSocialActive: input.targetSocialActive,
    targetSmallTeam: input.targetSmallTeam,
    activityScore: clampInt(input.activityScore, 1, 5, 3),
    responseLevel: input.responseLevel,
    stage: "found",
    notes: (input.notes ?? "").trim(),
    lastContactAt: null,
    nextFollowUpAt: null,
    createdAt: now,
    updatedAt: now,
  };
  if (!row.name) return { ok: false, error: "NAME_REQUIRED" };
  store.set(row.id, row);
  persist();
  return { ok: true, row };
}

export type PatchFirstQuebecInput = Partial<{
  name: string;
  phone: string;
  email: string;
  city: FirstQuebecCity;
  source: FirstQuebecSource;
  targetIndependent: boolean;
  targetUnderFiveYears: boolean;
  targetSocialActive: boolean;
  targetSmallTeam: boolean;
  activityScore: number;
  responseLevel: FirstQuebecResponseLevel;
  stage: FirstQuebecStage;
  notes: string;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
}>;

export function patchFirstQuebecBroker(
  id: string,
  patch: PatchFirstQuebecInput,
): { ok: true; row: FirstQuebecBrokerRow } | { ok: false; error: string } {
  load();
  const prev = store.get(id);
  if (!prev) return { ok: false, error: "NOT_FOUND" };
  const now = new Date().toISOString();
  const next: FirstQuebecBrokerRow = { ...prev, updatedAt: now };
  if (patch.name !== undefined) next.name = patch.name.trim();
  if (patch.phone !== undefined) next.phone = patch.phone.trim();
  if (patch.email !== undefined) next.email = patch.email.trim();
  if (patch.city !== undefined) next.city = patch.city;
  if (patch.source !== undefined) next.source = patch.source;
  if (patch.targetIndependent !== undefined) next.targetIndependent = patch.targetIndependent;
  if (patch.targetUnderFiveYears !== undefined) next.targetUnderFiveYears = patch.targetUnderFiveYears;
  if (patch.targetSocialActive !== undefined) next.targetSocialActive = patch.targetSocialActive;
  if (patch.targetSmallTeam !== undefined) next.targetSmallTeam = patch.targetSmallTeam;
  if (patch.activityScore !== undefined) next.activityScore = clampInt(patch.activityScore, 1, 5, prev.activityScore);
  if (patch.responseLevel !== undefined) next.responseLevel = normalizeResponse(patch.responseLevel);
  if (patch.stage !== undefined && STAGES.includes(patch.stage)) next.stage = patch.stage;
  if (patch.notes !== undefined) next.notes = patch.notes;
  if (patch.lastContactAt !== undefined) next.lastContactAt = patch.lastContactAt;
  if (patch.nextFollowUpAt !== undefined) next.nextFollowUpAt = patch.nextFollowUpAt;
  if (!next.name) return { ok: false, error: "NAME_REQUIRED" };
  store.set(id, next);
  persist();
  return { ok: true, row: next };
}

