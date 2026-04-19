/**
 * File-backed registry — isolated from approval execution JSON stores.
 */

import fs from "fs";
import path from "path";

import type { FutureReviewCandidate } from "./future-review-candidate.types";

type DocV1 = {
  version: 1;
  candidates: Record<string, FutureReviewCandidate>;
  updatedAt: string;
};

const memory: { doc: DocV1 } = {
  doc: {
    version: 1,
    candidates: {},
    updatedAt: new Date().toISOString(),
  },
};

let loaded = false;

function defaultPath(): string {
  return path.join(process.cwd(), "data", "future-review-candidates.json");
}

function envPath(): string | null {
  const raw = process.env.FUTURE_REVIEW_CANDIDATES_JSON_PATH?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function resolvedPath(): string {
  return envPath() ?? defaultPath();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function resetFutureReviewCandidateStoreForTests(): void {
  memory.doc = {
    version: 1,
    candidates: {},
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
    if (parsed.version === 1 && parsed.candidates && typeof parsed.candidates === "object") {
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
    /* read-only env */
  }
}

export function getCandidate(id: string): FutureReviewCandidate | undefined {
  loadFromDisk();
  return memory.doc.candidates[id];
}

export function upsertCandidate(c: FutureReviewCandidate): void {
  loadFromDisk();
  memory.doc.candidates[c.id] = c;
  persist();
}

export function listCandidateValues(): FutureReviewCandidate[] {
  loadFromDisk();
  return Object.values(memory.doc.candidates).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
