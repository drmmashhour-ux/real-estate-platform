/**
 * Optional JSON persistence — in-memory primary; mirrors broker-pipeline pattern.
 */

import fs from "fs";
import path from "path";

import type {
  GrowthPolicyHistoryEntry,
  GrowthPolicyReviewRecord,
} from "@/modules/growth/policy/growth-policy-history.types";

type DocV1 = {
  version: 1;
  updatedAt: string;
  entries: Record<string, GrowthPolicyHistoryEntry>;
  reviews: GrowthPolicyReviewRecord[];
};

const memory: { doc: DocV1 } = {
  doc: {
    version: 1,
    updatedAt: new Date().toISOString(),
    entries: {},
    reviews: [],
  },
};

let loaded = false;

function defaultPath(): string {
  return path.join(process.cwd(), ".data", "growth-policy-history.json");
}

function envPath(): string | null {
  const raw = process.env.GROWTH_POLICY_HISTORY_JSON_PATH?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function resolvedPath(): string {
  return envPath() ?? defaultPath();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function resetGrowthPolicyHistoryStoreForTests(): void {
  memory.doc = {
    version: 1,
    updatedAt: nowIso(),
    entries: {},
    reviews: [],
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
    if (
      parsed.version === 1 &&
      parsed.entries &&
      parsed.reviews &&
      typeof parsed.updatedAt === "string"
    ) {
      memory.doc = parsed;
    }
  } catch {
    /* ignore corrupt file */
  }
}

function persist(): void {
  const fp = resolvedPath();
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    memory.doc.updatedAt = nowIso();
    fs.writeFileSync(fp, `${JSON.stringify(memory.doc, null, 2)}\n`, "utf8");
  } catch {
    /* read-only FS */
  }
}

export function getHistoryDocSnapshot(): DocV1 {
  loadFromDisk();
  return memory.doc;
}

export function replaceHistoryEntries(entries: Record<string, GrowthPolicyHistoryEntry>): void {
  loadFromDisk();
  memory.doc.entries = entries;
  persist();
}

export function setHistoryEntry(entry: GrowthPolicyHistoryEntry): void {
  loadFromDisk();
  memory.doc.entries[entry.fingerprint] = entry;
  persist();
}

export function appendReviewRecord(r: GrowthPolicyReviewRecord): void {
  loadFromDisk();
  memory.doc.reviews.push(r);
  persist();
}

export function getGrowthPolicyHistoryPersistenceMeta(): {
  jsonPathConfigured: boolean;
  persistenceMode: "memory" | "json_file";
} {
  const jsonPathConfigured = Boolean(process.env.GROWTH_POLICY_HISTORY_JSON_PATH?.trim());
  return {
    jsonPathConfigured,
    persistenceMode: "json_file",
  };
}
