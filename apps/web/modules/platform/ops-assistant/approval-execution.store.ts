/**
 * In-memory + JSON file backing for approval requests and low-risk internal artifacts.
 */

import fs from "fs";
import path from "path";

import type {
  ApprovalAuditEntry,
  ApprovalExecutionRequest,
  ExecutionArtifactRefs,
} from "./approval-execution.types";

const MAX_REQUESTS = 2_000;
const MAX_AUDIT = 5_000;
const MAX_TASKS = 2_000;
const MAX_DRAFTS = 2_000;
const MAX_REMINDERS = 1_000;
const MAX_CONFIG_DRAFTS = 500;

export type InternalTaskRecord = {
  id: string;
  kind: "review" | "followup";
  priorityId: string;
  title: string;
  href?: string;
  note?: string;
  status: "open" | "archived";
  createdAt: string;
  sourceRequestId: string;
};

export type InternalDraftRecord = {
  id: string;
  priorityId: string;
  title: string;
  body: string;
  createdAt: string;
  sourceRequestId: string;
  status: "active" | "discarded";
};

export type ConfigDraftRecord = {
  id: string;
  priorityId: string;
  keyHint: string;
  value: string;
  createdAt: string;
  sourceRequestId: string;
  status: "active" | "discarded";
};

export type OperatorReminderRecord = {
  id: string;
  priorityId: string;
  message: string;
  dueAt?: string;
  createdAt: string;
  sourceRequestId: string;
  status: "active" | "cleared";
};

type StateDocV1 = {
  version: 1;
  requests: Record<string, ApprovalExecutionRequest>;
  /** priorityId -> tag list (deduped) */
  internalTags: Record<string, string[]>;
  tasks: InternalTaskRecord[];
  drafts: InternalDraftRecord[];
  configDrafts: ConfigDraftRecord[];
  reminders: OperatorReminderRecord[];
  audit: ApprovalAuditEntry[];
  updatedAt: string;
};

const memory: {
  requests: Map<string, ApprovalExecutionRequest>;
  internalTags: Map<string, Set<string>>;
  tasks: InternalTaskRecord[];
  drafts: InternalDraftRecord[];
  configDrafts: ConfigDraftRecord[];
  reminders: OperatorReminderRecord[];
  audit: ApprovalAuditEntry[];
} = {
  requests: new Map(),
  internalTags: new Map(),
  tasks: [],
  drafts: [],
  configDrafts: [],
  reminders: [],
  audit: [],
};

let loaded = false;

function defaultPath(): string {
  return path.join(process.cwd(), "data", "ops-assistant-approval-execution.json");
}

function envPath(): string | null {
  const raw = process.env.OPS_ASSISTANT_APPROVAL_STATE_JSON_PATH?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function resolvedPath(): string {
  return envPath() ?? defaultPath();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function resetApprovalExecutionStoreForTests(): void {
  memory.requests.clear();
  memory.internalTags.clear();
  memory.tasks = [];
  memory.drafts = [];
  memory.configDrafts = [];
  memory.reminders = [];
  memory.audit = [];
  loaded = true;
}

function loadFromDisk(): void {
  if (loaded) return;
  loaded = true;
  const fp = resolvedPath();
  if (!fs.existsSync(fp)) return;
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const parsed = JSON.parse(raw) as StateDocV1;
    if (parsed.version !== 1 || !parsed.requests) return;
    memory.requests.clear();
    for (const [id, r] of Object.entries(parsed.requests)) {
      memory.requests.set(id, r);
    }
    memory.internalTags.clear();
    for (const [pid, tags] of Object.entries(parsed.internalTags ?? {})) {
      memory.internalTags.set(pid, new Set(tags));
    }
    memory.tasks = Array.isArray(parsed.tasks) ? parsed.tasks.slice(-MAX_TASKS) : [];
    memory.drafts = Array.isArray(parsed.drafts) ? parsed.drafts.slice(-MAX_DRAFTS) : [];
    memory.configDrafts = Array.isArray(parsed.configDrafts) ? parsed.configDrafts.slice(-MAX_CONFIG_DRAFTS) : [];
    memory.reminders = Array.isArray(parsed.reminders) ? parsed.reminders.slice(-MAX_REMINDERS) : [];
    memory.audit = Array.isArray(parsed.audit) ? parsed.audit.slice(-MAX_AUDIT) : [];
  } catch {
    /* ignore */
  }
}

function persistToDisk(): void {
  const fp = resolvedPath();
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const doc: StateDocV1 = {
      version: 1,
      requests: Object.fromEntries(memory.requests.entries()),
      internalTags: Object.fromEntries(
        [...memory.internalTags.entries()].map(([k, v]) => [k, [...v]]),
      ),
      tasks: memory.tasks.slice(-MAX_TASKS),
      drafts: memory.drafts.slice(-MAX_DRAFTS),
      configDrafts: memory.configDrafts.slice(-MAX_CONFIG_DRAFTS),
      reminders: memory.reminders.slice(-MAX_REMINDERS),
      audit: memory.audit.slice(-MAX_AUDIT),
      updatedAt: nowIso(),
    };
    fs.writeFileSync(fp, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  } catch {
    /* read-only FS */
  }
}

export function recordRequest(req: ApprovalExecutionRequest): void {
  loadFromDisk();
  memory.requests.set(req.id, req);
  if (memory.requests.size > MAX_REQUESTS) {
    const ids = [...memory.requests.keys()].sort();
    const drop = ids.slice(0, ids.length - MAX_REQUESTS);
    for (const id of drop) memory.requests.delete(id);
  }
  persistToDisk();
}

export function getRequest(id: string): ApprovalExecutionRequest | undefined {
  loadFromDisk();
  return memory.requests.get(id);
}

export function updateRequest(id: string, patch: Partial<ApprovalExecutionRequest>): ApprovalExecutionRequest | undefined {
  loadFromDisk();
  const cur = memory.requests.get(id);
  if (!cur) return undefined;
  const next = { ...cur, ...patch };
  memory.requests.set(id, next);
  persistToDisk();
  return next;
}

export function listRequestsSorted(): ApprovalExecutionRequest[] {
  loadFromDisk();
  return [...memory.requests.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function findPendingDuplicate(suggestionId: string): ApprovalExecutionRequest | undefined {
  loadFromDisk();
  return [...memory.requests.values()].find((r) => r.status === "pending" && r.suggestionId === suggestionId);
}

/** Append-only audit — call through audit service for consistency */
export function appendAuditRaw(entry: ApprovalAuditEntry): void {
  loadFromDisk();
  memory.audit.push(entry);
  if (memory.audit.length > MAX_AUDIT) {
    memory.audit = memory.audit.slice(-MAX_AUDIT);
  }
  persistToDisk();
}

export function listAuditSorted(limit = 200): ApprovalAuditEntry[] {
  loadFromDisk();
  return memory.audit.slice(-limit).reverse();
}

export function pushTask(t: InternalTaskRecord): void {
  loadFromDisk();
  memory.tasks.push(t);
  if (memory.tasks.length > MAX_TASKS) memory.tasks = memory.tasks.slice(-MAX_TASKS);
  persistToDisk();
}

export function findTask(id: string): InternalTaskRecord | undefined {
  loadFromDisk();
  return memory.tasks.find((x) => x.id === id);
}

export function archiveTask(id: string): boolean {
  loadFromDisk();
  const t = memory.tasks.find((x) => x.id === id);
  if (!t || t.status !== "open") return false;
  t.status = "archived";
  persistToDisk();
  return true;
}

export function pushDraft(d: InternalDraftRecord): void {
  loadFromDisk();
  memory.drafts.push(d);
  if (memory.drafts.length > MAX_DRAFTS) memory.drafts = memory.drafts.slice(-MAX_DRAFTS);
  persistToDisk();
}

export function discardDraft(id: string): boolean {
  loadFromDisk();
  const d = memory.drafts.find((x) => x.id === id);
  if (!d || d.status !== "active") return false;
  d.status = "discarded";
  persistToDisk();
  return true;
}

export function findDraft(id: string): InternalDraftRecord | undefined {
  loadFromDisk();
  return memory.drafts.find((x) => x.id === id);
}

export function pushConfigDraft(c: ConfigDraftRecord): void {
  loadFromDisk();
  memory.configDrafts.push(c);
  if (memory.configDrafts.length > MAX_CONFIG_DRAFTS) {
    memory.configDrafts = memory.configDrafts.slice(-MAX_CONFIG_DRAFTS);
  }
  persistToDisk();
}

export function discardConfigDraft(id: string): boolean {
  loadFromDisk();
  const c = memory.configDrafts.find((x) => x.id === id);
  if (!c || c.status !== "active") return false;
  c.status = "discarded";
  persistToDisk();
  return true;
}

export function findConfigDraft(id: string): ConfigDraftRecord | undefined {
  loadFromDisk();
  return memory.configDrafts.find((x) => x.id === id);
}

export function pushReminder(r: OperatorReminderRecord): void {
  loadFromDisk();
  memory.reminders.push(r);
  if (memory.reminders.length > MAX_REMINDERS) memory.reminders = memory.reminders.slice(-MAX_REMINDERS);
  persistToDisk();
}

export function clearReminder(id: string): boolean {
  loadFromDisk();
  const r = memory.reminders.find((x) => x.id === id);
  if (!r || r.status !== "active") return false;
  r.status = "cleared";
  persistToDisk();
  return true;
}

export function findReminder(id: string): OperatorReminderRecord | undefined {
  loadFromDisk();
  return memory.reminders.find((x) => x.id === id);
}

export function addTag(priorityId: string, tag: string): void {
  loadFromDisk();
  const t = tag.trim();
  if (!t) return;
  let set = memory.internalTags.get(priorityId);
  if (!set) {
    set = new Set();
    memory.internalTags.set(priorityId, set);
  }
  set.add(t);
  persistToDisk();
}

export function removeTag(priorityId: string, tag: string): boolean {
  loadFromDisk();
  const set = memory.internalTags.get(priorityId);
  if (!set) return false;
  const ok = set.delete(tag);
  persistToDisk();
  return ok;
}

export function getTags(priorityId: string): string[] {
  loadFromDisk();
  return [...(memory.internalTags.get(priorityId) ?? [])];
}

export function stashExecutionArtifactRefs(requestId: string, refs: ExecutionArtifactRefs): void {
  updateRequest(requestId, { artifactRefs: refs });
}
