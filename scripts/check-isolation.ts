/**
 * HARD isolation scan — country apps (LECIPM web, Darlink syria, UAE) + shared packages.
 * Run: `pnpm check:isolation`
 * Exit 1 on violation.
 */

import fs from "fs";
import path from "path";

import { ISOLATION_BOUNDARY_VIOLATION } from "../rules/isolation-constants.mjs";

const ERR = ISOLATION_BOUNDARY_VIOLATION;

const SKIP_DIR = new Set([
  "node_modules",
  ".next",
  "generated",
  ".turbo",
  "coverage",
  "dist",
  "out",
  "build",
]);

const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

/** Strip line comments // and block /* — reduces false positives on docs in comments. */
function stripTsComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");
}

/** @param {string} repoRoot */
function walkDir(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIR.has(ent.name)) continue;
      walkDir(full, out);
    } else if (ent.isFile() && SOURCE_EXT.has(path.extname(ent.name))) {
      out.push(full);
    }
  }
}

function resolveRepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    const webApp = path.join(dir, "apps", "web", "app");
    const pkg = path.join(dir, "package.json");
    if (fs.existsSync(webApp) && fs.existsSync(pkg)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Could not locate monorepo root (expected apps/web/app).");
}

/** Syria: guard definitions / tests may mention forbidden tokens intentionally. */
function syriaAllowlisted(relFromSyria: string): boolean {
  const n = relFromSyria.replace(/\\/g, "/");
  return (
    n === "src/lib/guard.ts" ||
    n === "src/lib/assertContext.ts" ||
    n === "src/lib/__tests__/guard.test.ts" ||
    n === "src/lib/brand/darlink-guardrails.ts" ||
    n === "src/lib/brand/__tests__/darlink-guardrails.test.ts"
  );
}

/** Web: integration boundary docs for Syria region lane. */
function webDarlinkAllowlisted(relFromRepo: string): boolean {
  const n = relFromRepo.replace(/\\/g, "/");
  return (
    n.endsWith("README_GUARD.md") ||
    n.endsWith(".env.example") ||
    n === "apps/web/lib/assertContext.ts" ||
    n.includes("/docs/architecture/") ||
    n.includes("/.cursor/rules/") ||
    n.includes("/scripts/check-isolation.ts") ||
    n.includes("/modules/integrations/regions/syria/")
  );
}

function scanSyria(repoRoot: string, violations: string[]): void {
  const root = path.join(repoRoot, "apps", "syria", "src");
  if (!fs.existsSync(root)) return;
  const files: string[] = [];
  walkDir(root, files);
  const syriaBase = path.join(repoRoot, "apps", "syria");

  for (const abs of files) {
    const relFromSyria = path.relative(syriaBase, abs).replace(/\\/g, "/");
    let content: string;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    const scanBody = stripTsComments(content);

    if (
      /from\s+["']@lecipm\/web/.test(content) ||
      /from\s+["']@lecipm\/uae/.test(content) ||
      /from\s+["'][^"']*apps\/web/.test(content) ||
      /from\s+["'][^"']*apps\/uae/.test(content) ||
      /@lecipm\/web\//.test(content) ||
      /@lecipm\/uae\//.test(content)
    ) {
      violations.push(`${ERR} — cross-app import in apps/syria/${relFromSyria}`);
    }

    if (syriaAllowlisted(relFromSyria)) continue;

    const lower = scanBody.toLowerCase();
    if (lower.includes("quebec") || lower.includes("oaciq")) {
      violations.push(`${ERR} — forbidden Canada-regulatory token in apps/syria/${relFromSyria}`);
    }
    if (/\blecipm\b/i.test(scanBody)) {
      violations.push(`${ERR} — \"lecipm\" token in apps/syria/${relFromSyria}`);
    }
    if (/\bcanada\b/i.test(scanBody)) {
      violations.push(`${ERR} — \"canada\" token in apps/syria/${relFromSyria}`);
    }
  }
}

function scanWeb(repoRoot: string, violations: string[]): void {
  const webRoot = path.join(repoRoot, "apps", "web");
  const subdirs = ["app", "components", "lib", "modules", "config"];
  const files: string[] = [];
  for (const sd of subdirs) {
    const d = path.join(webRoot, sd);
    if (fs.existsSync(d)) walkDir(d, files);
  }

  for (const abs of files) {
    const rel = path.relative(repoRoot, abs).replace(/\\/g, "/");
    let content: string;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    if (
      /from\s+["']@lecipm\/syria/.test(content) ||
      /from\s+["']@lecipm\/uae/.test(content) ||
      /from\s+["'][^"']*apps\/syria/.test(content) ||
      /from\s+["'][^"']*apps\/uae/.test(content) ||
      /\bimport\s*\(\s*["'][^"']*apps\/syria/.test(content)
    ) {
      violations.push(`${ERR} — cross-app import in ${rel}`);
    }

    if (webDarlinkAllowlisted(rel)) continue;

    const scanBody = stripTsComments(content);
    if (/\bdarlink\b/i.test(scanBody)) {
      violations.push(`${ERR} — \"darlink\" product token in ${rel} (keep Darlink-only logic in apps/syria)`);
    }
  }
}

/** UAE: allow unified isolation copy in runtime guard (may name other products). */
function uaeProductTokenAllowlisted(relFromRepo: string): boolean {
  const n = relFromRepo.replace(/\\/g, "/");
  return n === "apps/uae/lib/assertContext.ts";
}

function scanUae(repoRoot: string, violations: string[]): void {
  const uaeRoot = path.join(repoRoot, "apps", "uae");
  if (!fs.existsSync(uaeRoot)) return;

  const roots = [
    path.join(uaeRoot, "src"),
    path.join(uaeRoot, "lib"),
    path.join(uaeRoot, "config"),
    path.join(uaeRoot, "app"),
  ].filter((p) => fs.existsSync(p));

  const files: string[] = [];
  for (const r of roots) walkDir(r, files);

  for (const abs of files) {
    const rel = path.relative(repoRoot, abs).replace(/\\/g, "/");
    let content: string;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    if (
      /from\s+["']@lecipm\/web/.test(content) ||
      /from\s+["']@lecipm\/syria/.test(content) ||
      /from\s+["'][^"']*apps\/web/.test(content) ||
      /from\s+["'][^"']*apps\/syria/.test(content)
    ) {
      violations.push(`${ERR} — cross-app import in ${rel}`);
    }

    if (uaeProductTokenAllowlisted(rel)) continue;

    const scanBody = stripTsComments(content);
    const lower = scanBody.toLowerCase();
    if (lower.includes("darlink") || /\blecipm\b/.test(lower)) {
      violations.push(`${ERR} — foreign product token in ${rel}`);
    }
    if (lower.includes("quebec") || lower.includes("oaciq")) {
      violations.push(`${ERR} — forbidden non-UAE jurisdiction token in ${rel}`);
    }
    if (/\bsyria\b/i.test(scanBody) && /\bdarlink\b/i.test(scanBody)) {
      violations.push(`${ERR} — embedded Syria/Darlink product coupling in ${rel}`);
    }
  }
}

function scanPackages(repoRoot: string, violations: string[]): void {
  const pkgRoot = path.join(repoRoot, "packages");
  if (!fs.existsSync(pkgRoot)) return;
  const files: string[] = [];
  walkDir(pkgRoot, files);

  for (const abs of files) {
    const rel = path.relative(repoRoot, abs).replace(/\\/g, "/");
    if (rel.endsWith(".md")) continue;
    let content: string;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    if (
      /from\s+["'][^"']*apps\/(web|syria|uae)/.test(content) ||
      /from\s+["']@lecipm\/(web|syria|uae)/.test(content) ||
      /require\s*\(\s*["'][^"']*apps\/(web|syria|uae)/.test(content)
    ) {
      violations.push(`${ERR} — packages must not import apps/* (${rel})`);
    }
  }
}

function main(): void {
  const repoRoot = resolveRepoRoot();
  const violations: string[] = [];
  scanSyria(repoRoot, violations);
  scanWeb(repoRoot, violations);
  scanUae(repoRoot, violations);
  scanPackages(repoRoot, violations);

  if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exit(1);
  }
  console.log("✅ Monorepo isolation check passed (syria + web + uae + packages scan).");
}

main();
