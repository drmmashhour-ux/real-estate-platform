#!/usr/bin/env npx tsx
/**
 * V8 non-destructive change validator — compares working tree + index to a git base ref.
 * Does not modify the repository. Exit 1 when risky patterns are detected.
 *
 * Usage:
 *   pnpm --filter @lecipm/web run validate:v8-safe
 *   npx tsx scripts/validate-v8-nondestructive.ts --base=origin/main
 *   npx tsx scripts/validate-v8-nondestructive.ts --last-commit
 *   npx tsx scripts/validate-v8-nondestructive.ts --range=origin/main...HEAD
 *
 * Env:
 *   V8_VALIDATE_BASE   — ref to compare against (default: origin/main, then main)
 *   V8_VALIDATE_STRICT — if "1", treat warnings as failures
 *
 * Modes:
 *   default     — working tree + index vs BASE (broad; noisy on long-lived branches)
 *   --last-commit — only the latest commit (good for pre-push task checks)
 *   --range=A..B  — explicit git revision range
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");
const REPO_ROOT = findRepoRoot(WEB_ROOT);

type Severity = "error" | "warn";

type Violation = {
  severity: Severity;
  category: string;
  message: string;
  paths?: string[];
};

function findRepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 20; i++) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

function git(cwd: string, args: string, allowFail = false): string {
  try {
    return execSync(`git ${args}`, {
      encoding: "utf8",
      cwd,
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (e) {
    if (allowFail) return "";
    throw e;
  }
}

function resolveBaseRef(cwd: string, preferred: string): string {
  const candidates = [preferred, "origin/main", "main", "master", "HEAD~1"];
  for (const c of candidates) {
    if (!c) continue;
    try {
      execSync(`git rev-parse --verify ${c}`, { cwd, stdio: ["pipe", "pipe", "pipe"] });
      return c;
    } catch {
      /* next */
    }
  }
  return preferred || "HEAD~1";
}

function parseArgs(argv: string[]): {
  base: string;
  stagedOnly: boolean;
  lastCommit: boolean;
  range: string | null;
} {
  let base = process.env.V8_VALIDATE_BASE || "";
  let stagedOnly = false;
  let lastCommit = false;
  let range: string | null = null;
  for (const a of argv) {
    if (a.startsWith("--base=")) base = a.slice("--base=".length);
    if (a === "--staged") stagedOnly = true;
    if (a === "--last-commit") lastCommit = true;
    if (a.startsWith("--range=")) range = a.slice("--range=".length);
  }
  if (!base) base = "origin/main";
  return { base, stagedOnly, lastCommit, range };
}

const SOURCE_GLOB = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const PRISMA_SCHEMA = /schema\.prisma$/;

function parseNameStatus(nameStatus: string): { deleted: string[]; added: string[]; modified: string[] } {
  const deleted: string[] = [];
  const added: string[] = [];
  const modified: string[] = [];
  for (const line of nameStatus.split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split(/\t+/);
    const code = parts[0]?.trim() ?? "";
    if (code.startsWith("D")) {
      deleted.push(parts[1]?.trim() ?? "");
      continue;
    }
    if (code.startsWith("A")) {
      added.push(parts[1]?.trim() ?? "");
      continue;
    }
    if (code.startsWith("M")) {
      modified.push(parts[1]?.trim() ?? "");
      continue;
    }
    if (code.startsWith("R") && parts.length >= 3) {
      deleted.push(parts[1]?.trim() ?? "");
      added.push(parts[2]?.trim() ?? "");
    }
  }
  return { deleted, added, modified };
}

/** Extract unified diff hunks whose path contains schema.prisma */
function extractPrismaDiff(fullDiff: string): string {
  const out: string[] = [];
  const chunks = fullDiff.split(/^diff --git /m);
  for (const ch of chunks) {
    const head = ch.slice(0, 400);
    if (head.includes("schema.prisma")) out.push(ch);
  }
  return out.join("\n");
}

function numstatForRange(cwd: string, range: string): Array<{ add: number; del: number; file: string }> {
  const raw = git(cwd, `diff ${range} --numstat`, true);
  return parseNumstatRaw(raw);
}

function parseNumstatRaw(raw: string): Array<{ add: number; del: number; file: string }> {
  const rows: Array<{ add: number; del: number; file: string }> = [];
  const seen = new Set<string>();
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const [a, d, ...fparts] = line.split(/\t/);
    const file = fparts.join("\t");
    if (!file || seen.has(file)) continue;
    seen.add(file);
    const add = a === "-" ? 0 : Number(a) || 0;
    const del = d === "-" ? 0 : Number(d) || 0;
    rows.push({ add, del, file });
  }
  return rows;
}

function numstat(cwd: string, base: string): Array<{ add: number; del: number; file: string }> {
  const raw = git(cwd, `diff ${base} --numstat`, true) + "\n" + git(cwd, `diff --cached ${base} --numstat`, true);
  return parseNumstatRaw(raw);
}

const REMOVED_EXPORT_PATTERNS: RegExp[] = [
  /^-\s*export\s+async\s+function\s+(\w+)/,
  /^-\s*export\s+function\s+(\w+)/,
  /^-\s*export\s+(?:type|interface)\s+(\w+)/,
  /^-\s*export\s+const\s+(\w+)\s*[:=]/,
  /^-\s*export\s+class\s+(\w+)/,
];

function findRemovedExports(diff: string): string[] {
  const names: string[] = [];
  for (const line of diff.split("\n")) {
    for (const re of REMOVED_EXPORT_PATTERNS) {
      const m = line.match(re);
      if (m?.[1]) names.push(m[1]);
    }
    if (line.startsWith("-export {")) {
      const inner = line.replace(/^-\s*export\s*\{\s*/, "").replace(/\s*\}.*$/, "");
      for (const part of inner.split(",")) {
        const n = part.replace(/\s+as\s+\w+/, "").trim().split(/\s+/)[0];
        if (n && /^[A-Za-z_]/.test(n)) names.push(n);
      }
    }
  }
  return [...new Set(names)].slice(0, 80);
}

function prismaRiskLines(diff: string): string[] {
  const hits: string[] = [];
  for (const line of diff.split("\n")) {
    if (!line.startsWith("-") || line.startsWith("---")) continue;
    const L = line.slice(1);
    if (/^\s*model\s+\w+/.test(L)) hits.push("removed model declaration line");
    if (/^\s*@@map\(/.test(L)) hits.push("removed @@map");
    if (/^\s*@@index\(/.test(L)) hits.push("removed @@index");
    if (/^\s*@@unique\(/.test(L)) hits.push("removed @@unique");
    if (/^\s*@@id\(/.test(L)) hits.push("removed @@id");
  }
  return [...new Set(hits)].slice(0, 20);
}

function isRouteOrApiPath(p: string): boolean {
  return (
    p.includes("/api/") ||
    p.includes("route.ts") ||
    p.includes("route.js") ||
    /app\/api\//.test(p)
  );
}

/** Heuristic: new V8 path markers without legacy escape hatch in same touched file content (from diff hunk). */
function legacyPathHeuristic(diff: string): Violation | null {
  const chunks = diff.split(/^diff --git /m).filter(Boolean);
  const files: string[] = [];
  for (const ch of chunks) {
    const hasV8 =
      /\bv8_rollout\b/.test(ch) ||
      /\bV8_ROLLOUT\b/.test(ch) ||
      /\bbrainV8\b/.test(ch) ||
      ch.includes("Brain V8");
    if (!hasV8) continue;
    const hasLegacy =
      /path:\s*["']legacy["']/.test(ch) ||
      /\b!rollout\b/.test(ch) ||
      /\blegacy path\b/i.test(ch) ||
      /\bFEATURE_.*OFF\b/.test(ch) ||
      /\breturn\s+livePromise\b/.test(ch);
    if (hasLegacy) continue;
    const m = ch.match(/^a\/(.+?)\s+b\/(.+?)(?:\n|$)/);
    if (m?.[2]) files.push(m[2]);
    else files.push("(unknown file in hunk)");
  }
  if (files.length === 0) return null;
  return {
    severity: "warn",
    category: "legacy_path_heuristic",
    message:
      "V8 markers present in a file hunk without obvious legacy/!rollout/return livePromise — verify default-off and legacy path still exist.",
    paths: [...new Set(files)].slice(0, 15),
  };
}

const MAX_REMOVED_LINES_WARN = 120;
const MAX_TOTAL_CHURN_WARN = 350;

function main(): void {
  const strict = process.env.V8_VALIDATE_STRICT === "1";
  const argv = process.argv.slice(2);
  let { base, stagedOnly, lastCommit, range: rangeArg } = parseArgs(argv);
  base = resolveBaseRef(REPO_ROOT, base);

  const violations: Violation[] = [];
  const analyzedFiles = new Set<string>();

  let nameStatus = "";
  let unifiedDiff = "";
  let modeLabel = `working tree vs ${base}`;
  try {
    if (rangeArg) {
      modeLabel = `range ${rangeArg}`;
      unifiedDiff = git(REPO_ROOT, `diff ${rangeArg} --unified=3`, true);
      nameStatus = git(REPO_ROOT, `diff --name-status ${rangeArg}`, true);
    } else if (lastCommit) {
      modeLabel = "last commit (HEAD)";
      unifiedDiff = git(REPO_ROOT, "show HEAD --unified=3 --pretty=medium", true);
      nameStatus = git(REPO_ROOT, "show --name-status --pretty=format: HEAD", true);
    } else {
      unifiedDiff = git(REPO_ROOT, stagedOnly ? `diff --cached ${base} --unified=3` : `diff ${base} --unified=3`, true);
      unifiedDiff +=
        "\n" + git(REPO_ROOT, stagedOnly ? "" : `diff --cached ${base} --unified=3`, true);
      nameStatus = git(REPO_ROOT, stagedOnly ? `diff --cached --name-status ${base}` : `diff --name-status ${base}`, true);
      nameStatus +=
        "\n" + git(REPO_ROOT, stagedOnly ? "" : `diff --cached --name-status ${base}`, true);
    }
  } catch (e) {
    console.error("[v8:validate] git diff failed — is this a git repository?", String(e));
    process.exit(1);
    return;
  }

  const { deleted, added, modified } = parseNameStatus(nameStatus);
  const deletedPaths = deleted.filter(Boolean);
  for (const p of [...deletedPaths, ...added, ...modified]) analyzedFiles.add(p);

  for (const p of deletedPaths) {
    const route = isRouteOrApiPath(p);
    violations.push({
      severity: "error",
      category: route ? "route_or_api_deletion" : "file_deletion",
      message: route ? `Route/API (or app route) file deleted: ${p}` : `Tracked file deleted: ${p}`,
      paths: [p],
    });
  }

  const stats =
    rangeArg || lastCommit
      ? numstatForRange(REPO_ROOT, rangeArg ? rangeArg : "HEAD~1..HEAD")
      : numstat(REPO_ROOT, base);
  for (const row of stats) {
    analyzedFiles.add(row.file);
    if (!SOURCE_GLOB.test(row.file) && !PRISMA_SCHEMA.test(row.file)) continue;
    if (row.del >= MAX_REMOVED_LINES_WARN) {
      violations.push({
        severity: row.del >= 250 ? "error" : "warn",
        category: "large_line_removal",
        message: `Heavy removal in ${row.file}: ${row.del} lines removed (${row.add} added) — possible destructive rewrite`,
        paths: [row.file],
      });
    }
    if (row.add + row.del >= MAX_TOTAL_CHURN_WARN) {
      violations.push({
        severity: "warn",
        category: "large_churn",
        message: `High churn in ${row.file}: +${row.add} / -${row.del} lines`,
        paths: [row.file],
      });
    }
  }

  const removedExports = findRemovedExports(unifiedDiff);
  if (removedExports.length > 0) {
    violations.push({
      severity: "warn",
      category: "removed_export_symbols",
      message: `Removed export-like lines detected (verify not a breaking API removal): ${removedExports.slice(0, 12).join(", ")}${removedExports.length > 12 ? " …" : ""}`,
      paths: [],
    });
  }

  const prismaDiff = extractPrismaDiff(unifiedDiff);
  if (prismaDiff.length > 0 || stats.some((s) => PRISMA_SCHEMA.test(s.file))) {
    const risks = prismaRiskLines(prismaDiff.length > 0 ? prismaDiff : unifiedDiff);
    if (risks.length > 0) {
      violations.push({
        severity: "error",
        category: "prisma_schema_destructive_hint",
        message: `Prisma schema diff hints: ${risks.join("; ")}`,
        paths: ["**/schema.prisma"],
      });
    }
  }

  const legacyV = legacyPathHeuristic(unifiedDiff);
  if (legacyV) violations.push(legacyV);

  const errors = violations.filter((v) => v.severity === "error");
  const warns = violations.filter((v) => v.severity === "warn");

  const relWeb = relative(REPO_ROOT, WEB_ROOT) || ".";

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  V8 non-destructive validation");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  repo:     ${REPO_ROOT}`);
  console.log(`  web app:  ${relWeb}`);
  console.log(`  mode:     ${modeLabel}`);
  console.log(`  base ref: ${base}${stagedOnly ? " (staged only)" : ""}`);
  console.log(`  files touched (approx): ${analyzedFiles.size}`);
  console.log("");

  if (violations.length === 0) {
    console.log("  Result: PASS — no destructive patterns flagged.");
    console.log("");
    process.exit(0);
    return;
  }

  console.log(`  Violations: ${violations.length} (${errors.length} error(s), ${warns.length} warning(s))`);
  console.log("");

  let i = 1;
  for (const v of violations) {
    const tag = v.severity === "error" ? "ERROR" : "WARN ";
    console.log(`  [${i++}] ${tag}  ${v.category}`);
    console.log(`       ${v.message}`);
    if (v.paths?.length) console.log(`       paths: ${v.paths.join(", ")}`);
    console.log("");
  }

  console.log("  Risk summary:");
  console.log(`    • File deletions: ${deletedPaths.length}`);
  console.log(`    • Removed export hints: ${removedExports.length}`);
  console.log(`    • Large removals / churn: see items above`);
  console.log("");

  const fail = errors.length > 0 || (strict && warns.length > 0);
  if (fail) {
    console.log("  Result: FAIL");
    console.log("");
    process.exit(1);
    return;
  }

  console.log("  Result: PASS (warnings only — set V8_VALIDATE_STRICT=1 to fail on warnings)");
  console.log("");
  process.exit(0);
}

main();
