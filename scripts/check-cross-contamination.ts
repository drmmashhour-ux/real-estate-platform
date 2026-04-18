/**
 * Scan Darlink (`apps/syria`) for accidental Canada-product / web-app coupling.
 * Run: `pnpm check:darlink-isolation` (repo root) or `pnpm check:isolation` from `apps/syria`.
 * Exit 1 if violations found.
 */

import fs from "fs";
import path from "path";

function resolveSyriaAppRoot(): string {
  const cwd = process.cwd();
  const fromRepo = path.join(cwd, "apps", "syria");
  if (fs.existsSync(path.join(fromRepo, "src"))) return fromRepo;
  try {
    const pjPath = path.join(cwd, "package.json");
    if (fs.existsSync(pjPath)) {
      const pj = JSON.parse(fs.readFileSync(pjPath, "utf8")) as { name?: string };
      if (pj.name === "@lecipm/syria" && fs.existsSync(path.join(cwd, "src"))) return cwd;
    }
  } catch {
    /* ignore */
  }
  throw new Error("Could not locate apps/syria — run from monorepo root or apps/syria.");
}

const TARGET = resolveSyriaAppRoot();

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  "generated",
  ".turbo",
  "coverage",
  "dist",
]);

const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

/** Paths under `apps/syria/` allowed to mention blocked tokens (guard definitions only). */
function isAllowlistedSyriaPath(relFromSyria: string): boolean {
  const n = relFromSyria.replace(/\\/g, "/");
  return (
    n === "src/lib/guard.ts" ||
    n === "src/lib/__tests__/guard.test.ts" ||
    n === "src/lib/brand/darlink-guardrails.ts" ||
    n === "src/lib/brand/__tests__/darlink-guardrails.test.ts"
  );
}

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIR_NAMES.has(ent.name)) continue;
      walk(full, out);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name);
      if (SOURCE_EXT.has(ext)) {
        out.push(full);
      }
    }
  }
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function main(): void {
  if (!fs.existsSync(TARGET)) {
    console.error(`Expected ${TARGET} — run from monorepo root.`);
    process.exit(1);
  }

  const files: string[] = [];
  const srcRoot = path.join(TARGET, "src");
  if (fs.existsSync(srcRoot)) {
    walk(srcRoot, files);
  }

  const violations: string[] = [];

  for (const abs of files) {
    const relFromSyria = path.relative(TARGET, abs).replace(/\\/g, "/");
    const relCwd = toPosix(path.relative(process.cwd(), abs));
    let content: string;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    const lower = content.toLowerCase();

    if (
      /from\s+["']@lecipm\/web/.test(content) ||
      /from\s+["'][^"']*apps\/web/.test(content) ||
      /@lecipm\/web\//.test(content)
    ) {
      violations.push(`❌ Cross-app import toward Canada web app in ${relCwd}`);
    }

    if (isAllowlistedSyriaPath(relFromSyria)) {
      continue;
    }

    if (lower.includes("quebec") || lower.includes("oaciq")) {
      violations.push(`❌ Forbidden jurisdiction token in ${relCwd}`);
    }

    if (lower.includes("lecipm")) {
      violations.push(`❌ Forbidden "lecipm" token in ${relCwd} (Darlink code/comments must stay neutral)`);
    }
  }

  if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exit(1);
  }

  console.log("✅ apps/syria cross-contamination check passed.");
}

main();
