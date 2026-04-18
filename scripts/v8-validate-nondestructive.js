#!/usr/bin/env node
/**
 * V8 non-destructive validator — compares working tree + index to HEAD.
 * Read-only. Exit 1 when risky patterns are detected.
 *
 * Checks (non-exhaustive):
 * - Deleted / renamed tracked files
 * - Large per-file line removals (possible rewrites)
 * - Aggregate deletion volume across the diff
 * - Suspicious Prisma / SQL churn and destructive patterns on removed lines
 * - Heuristic: removed export / route handler lines in TS/JS
 *
 * Usage: node scripts/v8-validate-nondestructive.js  |  pnpm validate:v8
 */
"use strict";

const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const SOURCE_FILE_REGEX = /\.(ts|tsx|js|jsx|mjs|cjs|json|prisma|sql)$/i;
const MAX_REMOVED_LINES_PER_FILE = 150;
/** Total removed lines across numstat (all text files) — batch deletion guardrail. */
const MAX_TOTAL_REMOVED_LINES_AGGREGATE = 8000;

const violations = [];

function run(cmd) {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      cwd: ROOT,
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    if (error.stdout) return error.stdout.toString();
    if (error.stderr) return error.stderr.toString();
    throw error;
  }
}

function safeRun(cmd) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: "utf8", cwd: ROOT, maxBuffer: 50 * 1024 * 1024 }) };
  } catch (error) {
    return {
      ok: false,
      output: (error.stdout || error.stderr || String(error.message || "")).toString(),
    };
  }
}

function addViolation(type, file, detail) {
  violations.push({ type, file, detail });
}

function combinedNameStatus() {
  return (
    run("git diff --name-status HEAD") + "\n" + run("git diff --cached --name-status HEAD")
  );
}

function combinedDiff(pathsGlob) {
  return run(`git diff HEAD --unified=0 ${pathsGlob}`) + "\n" + run(`git diff --cached HEAD --unified=0 ${pathsGlob}`);
}

const gitAvailable = safeRun("git rev-parse --is-inside-work-tree");
if (!gitAvailable.ok || !gitAvailable.output.includes("true")) {
  console.error("V8 Validator: not inside a git repository.");
  process.exit(1);
}

/* --- Deleted / renamed files --- */
for (const line of combinedNameStatus().split("\n")) {
  if (!line.trim()) continue;
  const tab = line.indexOf("\t");
  if (tab === -1) continue;
  const status = line.slice(0, tab).trim();
  const rest = line.slice(tab + 1);
  const paths = rest.split("\t").map((p) => p.trim()).filter(Boolean);

  if (status === "D" && paths[0]) {
    addViolation("FILE_DELETED", paths[0], "Tracked file deleted.");
  }
  if (status.startsWith("R") && paths.length >= 2) {
    addViolation("FILE_RENAMED", `${paths[0]} -> ${paths[1]}`, "Tracked file renamed; review for destructive changes.");
  }
}

/* --- Heavy removal (aggregate per file via numstat; NOT every removed line) --- */
function combinedNumstat() {
  return run("git diff HEAD --numstat") + "\n" + run("git diff --cached HEAD --numstat");
}

const numstatMap = new Map();
for (const line of combinedNumstat().split("\n")) {
  if (!line.trim()) continue;
  const parts = line.split("\t");
  if (parts.length < 3) continue;
  const a = parts[0];
  const b = parts[1];
  const file = parts.slice(2).join("\t");
  const add = a === "-" ? 0 : Number(a) || 0;
  const del = b === "-" ? 0 : Number(b) || 0;
  const prev = numstatMap.get(file) || { add: 0, del: 0 };
  numstatMap.set(file, { add: prev.add + add, del: prev.del + del });
}

const deletedSet = new Set();
for (const v of violations) {
  if (v.type === "FILE_DELETED") deletedSet.add(v.file);
}

for (const [file, stats] of numstatMap) {
  if (!SOURCE_FILE_REGEX.test(file)) continue;
  if (deletedSet.has(file)) continue;
  if (file.endsWith("prisma/schema.prisma") && stats.del > 800) {
    addViolation(
      "PRISMA_SCHEMA_LARGE_DIFF",
      file,
      `Large schema churn (+${stats.add} / -${stats.del}); review migrations and data safety.`,
    );
    continue;
  }
  if (stats.del >= MAX_REMOVED_LINES_PER_FILE) {
    addViolation(
      "LARGE_REMOVAL",
      file,
      `${stats.del} lines removed (${stats.add} added) — possible destructive rewrite.`,
    );
  }
}

/* --- Aggregate deletion volume (all paths in numstat) --- */
let totalRemovedAcrossDiff = 0;
for (const [, stats] of numstatMap) {
  totalRemovedAcrossDiff += stats.del;
}
if (totalRemovedAcrossDiff >= MAX_TOTAL_REMOVED_LINES_AGGREGATE) {
  addViolation(
    "WORKTREE_LARGE_DELETION_VOLUME",
    "aggregate",
    `${totalRemovedAcrossDiff} total lines removed vs HEAD (incl. staged) — review batch size and accidental bulk deletes.`,
  );
}

/* --- Prisma/SQL: destructive patterns on REMOVED lines only --- */
const prismaSqlRaw =
  run(`git diff HEAD --unified=0 -- ":(glob)**/*.prisma" ":(glob)**/*.sql"`) +
  "\n" +
  run(`git diff --cached HEAD --unified=0 -- ":(glob)**/*.prisma" ":(glob)**/*.sql"`);

let schemaPrismaHuge = false;
for (const [f, st] of numstatMap) {
  if (f.endsWith("prisma/schema.prisma") && (st.del > 800 || st.add > 1600)) {
    schemaPrismaHuge = true;
    break;
  }
}

function lineLooksDestructiveSql(L) {
  if (/drop\s+table/.test(L) || /drop\s+column/.test(L) || /drop\s+index/.test(L)) return "drop/truncate";
  if (/truncate\s+table/.test(L)) return "truncate table";
  if (/rename\s+column/.test(L) || /\brename\s+to\b/.test(L)) return "rename";
  if (/alter\s+table/.test(L) && /drop\s+column/.test(L)) return "alter table drop column";
  if (/drop\s+schema\b/.test(L) || /drop\s+database\b/.test(L)) return "drop schema/database";
  return null;
}

function lineLooksDestructivePrismaRemoved(raw) {
  const L = raw.trim().toLowerCase();
  if (/^enum\s+\w+/.test(L)) return "enum declaration removed";
  return null;
}

const seenSql = new Set();
let currentPrismaFile = "";
for (const line of prismaSqlRaw.split("\n")) {
  if (line.startsWith("+++ b/")) {
    currentPrismaFile = line.replace("+++ b/", "").trim();
    continue;
  }
  if (!line.startsWith("-") || line.startsWith("---")) continue;
  const raw = line.slice(1).trim();
  const L = raw.toLowerCase();
  if (currentPrismaFile.endsWith(".sql")) {
    const tag = lineLooksDestructiveSql(L);
    if (tag && !seenSql.has(`sql:${tag}`)) {
      seenSql.add(`sql:${tag}`);
      addViolation("DESTRUCTIVE_SCHEMA_PATTERN", currentPrismaFile || "sql", `Removed line category: ${tag}`);
    }
  }
  if (currentPrismaFile.endsWith(".prisma") && !schemaPrismaHuge) {
    if (/^\s*model\s+\w+/.test(raw) || /^\s*@@(map|index|unique|id)\(/.test(raw)) {
      const key = `prisma:${raw.slice(0, 80)}`;
      if (!seenSql.has(key)) {
        seenSql.add(key);
        addViolation("PRISMA_DECL_REMOVED", currentPrismaFile, raw.length > 120 ? `${raw.slice(0, 120)}…` : raw);
      }
    }
    const pTag = lineLooksDestructivePrismaRemoved(raw);
    if (pTag) {
      const key = `prisma-extra:${pTag}:${raw.slice(0, 60)}`;
      if (!seenSql.has(key)) {
        seenSql.add(key);
        addViolation("PRISMA_SUSPICIOUS_REMOVAL", currentPrismaFile, `Removed line category: ${pTag}`);
      }
    }
  }
}

/* --- Code diff for export / route heuristics --- */
const codeDiff =
  run(`git diff HEAD --unified=0 -- ":(glob)**/*.ts" ":(glob)**/*.tsx" ":(glob)**/*.js" ":(glob)**/*.jsx"`) +
  "\n" +
  run(
    `git diff --cached HEAD --unified=0 -- ":(glob)**/*.ts" ":(glob)**/*.tsx" ":(glob)**/*.js" ":(glob)**/*.jsx"`,
  );

const exportRemovalHints = [
  /^-\s*export\s+(async\s+)?function\s+/m,
  /^-\s*export\s+const\s+/m,
  /^-\s*export\s+class\s+/m,
  /^-\s*export\s+type\s+/m,
  /^-\s*export\s+interface\s+/m,
  /^-\s*export\s+default\b/m,
  /^-\s*export\s*\{/m,
  /^-\s*export\s+\*\s+from\s+['"]/m,
];

for (const regex of exportRemovalHints) {
  if (regex.test(codeDiff)) {
    addViolation("EXPORTED_SYMBOL_REMOVED", "source", "Detected removed export keyword line in diff (verify public API).");
    break;
  }
}

const removedRouteHints = [/^-\s*export\s+(async\s+)?(function\s+)?(GET|POST|PUT|PATCH|DELETE)\b/m];

for (const regex of removedRouteHints) {
  if (regex.test(codeDiff)) {
    addViolation("ROUTE_HANDLER_REMOVED", "routes", "Detected removed route handler export line in diff.");
    break;
  }
}

console.log("=== V8 NON-DESTRUCTIVE VALIDATION REPORT ===");
console.log("");

if (violations.length === 0) {
  console.log("PASS");
  console.log("No destructive changes detected in current git diff (vs HEAD, incl. staged).");
  process.exit(0);
}

console.log("FAIL");
console.log(`Violations found: ${violations.length}`);
console.log("");

violations.forEach((v, index) => {
  console.log(`${index + 1}. [${v.type}] ${v.file}`);
  console.log(`   ${v.detail}`);
});

process.exit(1);
