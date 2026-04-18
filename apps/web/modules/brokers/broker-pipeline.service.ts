/**
 * Lightweight broker prospect pipeline (V1). In-memory with optional JSON file persistence.
 * No Prisma — additive to DB-backed CRM elsewhere.
 */

import fs from "fs";
import path from "path";
import type { BrokerMessageScriptKind, BrokerPipelineSummary, BrokerProspect, BrokerStage } from "@/modules/brokers/broker-pipeline.types";
import {
  recordBrokerConversion,
  recordBrokerLost,
  recordBrokerNotesAdded,
  recordBrokerProspectAdded,
  recordBrokerStageChange,
  recordMissingDataWarning,
} from "@/modules/brokers/broker-monitoring.service";

const MAX_PROSPECTS = 5_000;

const store = new Map<string, BrokerProspect>();

function dataFilePath(): string | null {
  const raw = process.env.BROKER_PIPELINE_JSON_PATH?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function normalizeProspectRow(raw: unknown): BrokerProspect | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  const name = typeof r.name === "string" ? r.name : "";
  const stage = r.stage as BrokerStage;
  if (!id || !name || !stage) return null;

  let notes: string[] | undefined;
  if (Array.isArray(r.notes)) {
    notes = r.notes.filter((x): x is string => typeof x === "string");
  } else if (typeof r.notes === "string" && r.notes.trim()) {
    notes = r.notes.split("\n").map((l) => l.trim()).filter(Boolean);
  }

  return {
    id,
    name,
    email: typeof r.email === "string" ? r.email : undefined,
    phone: typeof r.phone === "string" ? r.phone : undefined,
    agency: typeof r.agency === "string" ? r.agency : undefined,
    stage,
    notes: notes?.length ? notes : undefined,
    source: r.source as BrokerProspect["source"],
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : new Date().toISOString(),
    lastContactAt: typeof r.lastContactAt === "string" ? r.lastContactAt : undefined,
    lastMessageType: r.lastMessageType as BrokerMessageScriptKind | undefined,
    firstPurchaseDate: typeof r.firstPurchaseDate === "string" ? r.firstPurchaseDate : undefined,
    totalSpent: typeof r.totalSpent === "number" && Number.isFinite(r.totalSpent) ? r.totalSpent : undefined,
    demoLeadPreviewShown: r.demoLeadPreviewShown === true,
  };
}

function loadFromDisk(): void {
  const fp = dataFilePath();
  if (!fp || !fs.existsSync(fp)) return;
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;
    store.clear();
    for (const row of parsed) {
      const n = normalizeProspectRow(row);
      if (n) store.set(n.id, n);
    }
  } catch {
    /* ignore corrupt file */
  }
}

function persistToDisk(): void {
  const fp = dataFilePath();
  if (!fp) return;
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const list = [...store.values()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    fs.writeFileSync(fp, JSON.stringify(list, null, 2), "utf8");
  } catch {
    /* read-only FS in some deploys */
  }
}

let loaded = false;

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  loadFromDisk();
}

function nowIso(): string {
  return new Date().toISOString();
}

export type CreateBrokerProspectInput = {
  name: string;
  email?: string;
  phone?: string;
  agency?: string;
  source?: BrokerProspect["source"];
  /** Initial note lines (optional). */
  notes?: string[];
  stage?: BrokerStage;
};

export function createBrokerProspect(data: CreateBrokerProspectInput): BrokerProspect {
  ensureLoaded();
  if (store.size >= MAX_PROSPECTS) {
    throw new Error("Broker pipeline store is full");
  }
  const id = crypto.randomUUID();
  const t = nowIso();
  const email = data.email?.trim() || undefined;
  const phone = data.phone?.trim() || undefined;
  if (!email?.trim() && !phone?.trim()) {
    recordMissingDataWarning();
  }
  const initialNotes = data.notes?.filter((n) => n.trim()).map((n) => n.trim()) ?? [];
  const row: BrokerProspect = {
    id,
    name: data.name.trim(),
    email,
    phone,
    agency: data.agency?.trim() || undefined,
    source: data.source ?? "manual",
    notes: initialNotes.length ? initialNotes : undefined,
    stage: data.stage ?? "new",
    createdAt: t,
    updatedAt: t,
  };
  store.set(id, row);
  recordBrokerProspectAdded();
  persistToDisk();
  return row;
}

export function updateBrokerStage(id: string, stage: BrokerStage): BrokerProspect | null {
  ensureLoaded();
  const prev = store.get(id);
  if (!prev) return null;
  if (prev.stage === stage) return prev;
  const from = prev.stage;
  recordBrokerStageChange(from, stage);
  if (stage === "converted" && from !== "converted") recordBrokerConversion();
  if (stage === "lost" && from !== "lost") recordBrokerLost();

  const next: BrokerProspect = { ...prev, stage, updatedAt: nowIso() };
  store.set(id, next);
  persistToDisk();
  return next;
}

export type BrokerContactMetaInput = {
  email?: string;
  phone?: string;
  agency?: string;
  lastContactAt?: string;
  lastMessageType?: BrokerMessageScriptKind;
};

export function updateBrokerContactMeta(id: string, input: BrokerContactMetaInput): BrokerProspect | null {
  ensureLoaded();
  const prev = store.get(id);
  if (!prev) return null;
  const next: BrokerProspect = {
    ...prev,
    email: input.email !== undefined ? input.email.trim() || undefined : prev.email,
    phone: input.phone !== undefined ? input.phone.trim() || undefined : prev.phone,
    agency: input.agency !== undefined ? input.agency.trim() || undefined : prev.agency,
    lastContactAt: input.lastContactAt ?? prev.lastContactAt,
    lastMessageType: input.lastMessageType ?? prev.lastMessageType,
    updatedAt: nowIso(),
  };
  store.set(id, next);
  persistToDisk();
  return next;
}

export function addBrokerNote(id: string, note: string): BrokerProspect | null {
  ensureLoaded();
  const prev = store.get(id);
  if (!prev) return null;
  const line = note.trim();
  if (!line) return prev;
  const stamp = new Date().toISOString().slice(0, 16);
  const entry = `[${stamp}] ${line}`;
  const notes = [...(prev.notes ?? []), entry];
  const next: BrokerProspect = { ...prev, notes, updatedAt: nowIso() };
  store.set(id, next);
  recordBrokerNotesAdded();
  persistToDisk();
  return next;
}

export function setDemoLeadPreviewShown(id: string, shown: boolean): BrokerProspect | null {
  ensureLoaded();
  const prev = store.get(id);
  if (!prev) return null;
  const next: BrokerProspect = { ...prev, demoLeadPreviewShown: shown, updatedAt: nowIso() };
  store.set(id, next);
  persistToDisk();
  return next;
}

export type MarkPurchaseInput = {
  firstPurchaseDate: string;
  totalSpent?: number;
  moveToConverted?: boolean;
};

export function markBrokerPurchaseOnProspect(id: string, input: MarkPurchaseInput): BrokerProspect | null {
  ensureLoaded();
  const prev = store.get(id);
  if (!prev) return null;
  let stage = prev.stage;
  if (input.moveToConverted !== false && stage !== "converted") {
    recordBrokerStageChange(stage, "converted");
    if (stage !== "converted") recordBrokerConversion();
    stage = "converted";
  }
  const next: BrokerProspect = {
    ...prev,
    stage,
    firstPurchaseDate: input.firstPurchaseDate,
    totalSpent: input.totalSpent ?? prev.totalSpent,
    updatedAt: nowIso(),
  };
  store.set(id, next);
  persistToDisk();
  return next;
}

export function findProspectByEmailLoose(email: string): BrokerProspect | null {
  ensureLoaded();
  const norm = email.trim().toLowerCase();
  if (!norm) return null;
  for (const p of store.values()) {
    if (p.email?.trim().toLowerCase() === norm) return p;
  }
  return null;
}

export function listBrokerPipeline(): BrokerProspect[] {
  ensureLoaded();
  return [...store.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function buildBrokerPipelineSummary(): BrokerPipelineSummary {
  const prospects = listBrokerPipeline();
  const byStage: BrokerPipelineSummary["byStage"] = {
    new: 0,
    contacted: 0,
    replied: 0,
    demo: 0,
    converted: 0,
    lost: 0,
  };
  for (const p of prospects) {
    byStage[p.stage] = (byStage[p.stage] ?? 0) + 1;
  }
  const total = prospects.length;
  const converted = byStage.converted;
  const conversionRate = total > 0 ? Math.round((converted / total) * 1000) / 10 : 0;
  return {
    total,
    byStage,
    conversionRate,
    createdAt: nowIso(),
  };
}

/** Test helper — clear memory store (does not delete file unless you remove path). */
export function __resetBrokerPipelineStoreForTests(): void {
  loaded = true;
  store.clear();
}
