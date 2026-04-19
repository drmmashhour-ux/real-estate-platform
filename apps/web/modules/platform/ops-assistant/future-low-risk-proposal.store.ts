/**
 * File-backed proposal store — separate from registry and execution.
 */

import fs from "fs";
import path from "path";

import type { FutureLowRiskActionProposal } from "./future-low-risk-proposal.types";

type DocV1 = {
  version: 1;
  proposals: Record<string, FutureLowRiskActionProposal>;
  updatedAt: string;
};

const memory: { doc: DocV1 } = {
  doc: {
    version: 1,
    proposals: {},
    updatedAt: new Date().toISOString(),
  },
};

let loaded = false;

function defaultPath(): string {
  return path.join(process.cwd(), "data", "future-low-risk-proposals.json");
}

function envPath(): string | null {
  const raw = process.env.FUTURE_LOW_RISK_PROPOSALS_JSON_PATH?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function resolvedPath(): string {
  return envPath() ?? defaultPath();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function resetFutureLowRiskProposalStoreForTests(): void {
  memory.doc = {
    version: 1,
    proposals: {},
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
    if (parsed.version === 1 && parsed.proposals && typeof parsed.proposals === "object") {
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
    /* ignore */
  }
}

export function getProposalRow(id: string): FutureLowRiskActionProposal | undefined {
  loadFromDisk();
  return memory.doc.proposals[id];
}

export function upsertProposalRow(p: FutureLowRiskActionProposal): void {
  loadFromDisk();
  memory.doc.proposals[p.id] = p;
  persist();
}

export function listProposalRows(): FutureLowRiskActionProposal[] {
  loadFromDisk();
  return Object.values(memory.doc.proposals).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
