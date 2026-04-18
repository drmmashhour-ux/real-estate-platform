/**
 * Runs git from the monorepo root and aggregates PR risk for `apps/web`.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { analyzePrRisk } from "./pr-risk-detector";
import { generatePrSummaryMarkdown } from "./pr-summary.generator";
import type { PrRecommendation, PrRiskLevel } from "./pr-risk-detector";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULE_DIR = __dirname;
const WEB_ROOT = join(MODULE_DIR, "../..");

function findGitRoot(start: string): string | null {
  let dir = start;
  while (true) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function git(cwd: string, args: string[]): { ok: boolean; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  return {
    ok: r.status === 0,
    stdout: String(r.stdout ?? ""),
    stderr: String(r.stderr ?? ""),
  };
}

export type PrReviewResult = {
  riskLevel: PrRiskLevel;
  criticalChanges: string[];
  warnings: string[];
  recommendation: PrRecommendation;
  summaryMarkdown: string;
  base: string;
  head: string;
  gitAvailable: boolean;
  /** Non-fatal issues (e.g. shallow clone). */
  notes: string[];
};

function resolveHead(cwd: string, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  const { stdout } = git(cwd, ["rev-parse", "HEAD"]);
  return stdout.trim() || "HEAD";
}

function resolveBase(cwd: string, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  for (const b of ["origin/main", "origin/master", "main", "master"]) {
    const r = git(cwd, ["rev-parse", "--verify", b]);
    if (r.ok && r.stdout.trim()) return b;
  }
  return "HEAD~1";
}

/**
 * Analyze changes between two refs for `apps/web` only.
 */
export function runPrReview(opts?: { base?: string; head?: string }): PrReviewResult {
  const notes: string[] = [];
  const gitRoot = findGitRoot(WEB_ROOT);
  const base = gitRoot ? resolveBase(gitRoot, opts?.base) : (opts?.base?.trim() ?? "main");
  const head = gitRoot ? resolveHead(gitRoot, opts?.head) : (opts?.head?.trim() ?? "HEAD");

  if (!gitRoot) {
    const summaryMarkdown = generatePrSummaryMarkdown({
      riskLevel: "medium",
      criticalChanges: [],
      warnings: ["Git metadata not found — cannot analyze diff."],
      recommendation: "REVIEW_REQUIRED",
      base,
      head,
    });
    return {
      riskLevel: "medium",
      criticalChanges: [],
      warnings: ["Git metadata not found — cannot analyze diff."],
      recommendation: "REVIEW_REQUIRED",
      summaryMarkdown,
      base,
      head,
      gitAvailable: false,
      notes,
    };
  }

  const range = `${base}..${head}`;
  const pathFilter = "apps/web";

  const nameStatus = git(gitRoot, ["diff", "--name-status", range, "--", pathFilter]);
  if (!nameStatus.ok) {
    notes.push(nameStatus.stderr.trim() || `git diff --name-status failed for ${range}`);
    const summaryMarkdown = generatePrSummaryMarkdown({
      riskLevel: "medium",
      criticalChanges: [],
      warnings: notes,
      recommendation: "REVIEW_REQUIRED",
      base,
      head,
    });
    return {
      riskLevel: "medium",
      criticalChanges: [],
      warnings: notes,
      recommendation: "REVIEW_REQUIRED",
      summaryMarkdown,
      base,
      head,
      gitAvailable: true,
      notes,
    };
  }

  const changedFiles: { path: string; status: "A" | "M" | "D" | "R" | "C" | "T" | "U" | "?" }[] = [];
  for (const line of nameStatus.stdout.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let stRaw: string;
    let path: string;
    if (trimmed.includes("\t")) {
      const tp = trimmed.split("\t");
      stRaw = tp[0]?.trim() ?? "";
      path = tp[tp.length - 1]?.trim() ?? "";
    } else {
      const parts = trimmed.split(/\s+/);
      stRaw = parts[0]?.trim() ?? "";
      path = parts.slice(1).join(" ").trim();
    }
    if (!path) continue;
    let status: "A" | "M" | "D" | "R" | "C" | "T" | "U" | "?" = "?";
    if (stRaw.startsWith("A")) status = "A";
    else if (stRaw.startsWith("M")) status = "M";
    else if (stRaw.startsWith("D")) status = "D";
    else if (stRaw.startsWith("R")) status = "R";
    else if (stRaw.startsWith("C")) status = "C";
    changedFiles.push({ path, status });
  }

  const numstat = git(gitRoot, ["diff", "--numstat", range, "--", pathFilter]);
  const lineStats = new Map<string, { add: number; del: number }>();
  if (numstat.ok) {
    for (const line of numstat.stdout.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [adds, dels, ...pathParts] = trimmed.split(/\t/);
      const p = pathParts.join("\t").trim();
      const add = Number.parseInt(adds ?? "0", 10) || 0;
      const del = Number.parseInt(dels ?? "0", 10) || 0;
      if (p) lineStats.set(p, { add, del });
    }
  } else {
    notes.push("git diff --numstat unavailable");
  }

  const patch = git(gitRoot, ["diff", range, "--", pathFilter]);
  const patchText = patch.ok ? patch.stdout : "";

  const analyzed = analyzePrRisk({
    changedFiles,
    lineStats,
    patchText: patchText || undefined,
  });

  const summaryMarkdown = generatePrSummaryMarkdown({
    riskLevel: analyzed.riskLevel,
    criticalChanges: analyzed.criticalChanges,
    warnings: analyzed.warnings,
    recommendation: analyzed.recommendation,
    base,
    head,
  });

  return {
    ...analyzed,
    summaryMarkdown,
    base,
    head,
    gitAvailable: true,
    notes,
  };
}
