/**
 * File-backed governance review records — separate from execution artifacts.
 */

import fs from "fs";
import path from "path";

import { APPROVAL_EXECUTABLE_ACTION_KINDS } from "./approval-execution.types";
import type { ApprovalExecutionReviewRecord } from "./approval-execution-review.types";

type DocV1 = {
  version: 1;
  records: Record<string, ApprovalExecutionReviewRecord>;
  governanceRollbackActive: boolean;
  updatedAt: string;
};

const memory: { doc: DocV1 } = {
  doc: {
    version: 1,
    records: {},
    governanceRollbackActive: false,
    updatedAt: new Date().toISOString(),
  },
};

let loaded = false;

function defaultPath(): string {
  return path.join(process.cwd(), "data", "approval-execution-governance.json");
}

function envPath(): string | null {
  const raw = process.env.APPROVAL_GOVERNANCE_JSON_PATH?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function resolvedPath(): string {
  return envPath() ?? defaultPath();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function resetApprovalExecutionReviewStoreForTests(): void {
  memory.doc = {
    version: 1,
    records: {},
    governanceRollbackActive: false,
    updatedAt: nowIso(),
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
    if (parsed.version === 1 && parsed.records && typeof parsed.governanceRollbackActive === "boolean") {
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

export function getGovernanceRollbackActive(): boolean {
  loadFromDisk();
  return memory.doc.governanceRollbackActive;
}

export function setGovernanceRollbackActive(v: boolean): void {
  loadFromDisk();
  memory.doc.governanceRollbackActive = v;
  persist();
}

export function getRecord(id: string): ApprovalExecutionReviewRecord | undefined {
  loadFromDisk();
  return memory.doc.records[id];
}

export function upsertRecord(r: ApprovalExecutionReviewRecord): void {
  loadFromDisk();
  memory.doc.records[r.id] = r;
  persist();
}

export function listAllRecords(): ApprovalExecutionReviewRecord[] {
  loadFromDisk();
  return Object.values(memory.doc.records).sort((a, b) => a.actionType.localeCompare(b.actionType));
}

export function ensureAllowlistIds(): string[] {
  return APPROVAL_EXECUTABLE_ACTION_KINDS.map((k) => `rev_${k}`);
}
