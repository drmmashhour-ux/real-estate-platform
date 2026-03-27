#!/usr/bin/env node
/**
 * Pre-commit guard: forbidden paths + max staged file size (50 MiB).
 * Invoked by lint-staged with staged file paths as argv.
 */
import fs from "node:fs";
import path from "node:path";

const MAX_BYTES = 50 * 1024 * 1024;
const files = process.argv.slice(2).filter((f) => f && !f.startsWith("-"));

function reasonIfForbidden(rel) {
  const n = rel.split(path.sep).join("/");
  if (/(^|\/)node_modules(\/|$)/.test(n)) return "node_modules must not be committed";
  if (/(^|\/)\.next(\/|$)/.test(n)) return ".next build output must not be committed";
  if (/(^|\/)dist(\/|$)/.test(n)) return "dist output must not be committed";
  if (/(^|\/)out(\/|$)/.test(n)) return "out/ build folder must not be committed";
  if (/(^|\/)\.turbo(\/|$)/.test(n)) return ".turbo cache must not be committed";
  if (/(^|\/)\.cache(\/|$)/.test(n)) return ".cache must not be committed";
  return null;
}

let failed = false;
for (const f of files) {
  const r = reasonIfForbidden(f);
  if (r) {
    console.error(`\x1b[31m[git-guard]\x1b[0m ${r}: ${f}`);
    failed = true;
    continue;
  }
  try {
    const st = fs.statSync(f);
    if (st.isFile() && st.size > MAX_BYTES) {
      console.error(
        `\x1b[31m[git-guard]\x1b[0m File exceeds 50 MiB limit (${(st.size / 1024 / 1024).toFixed(2)} MiB): ${f}`,
      );
      failed = true;
    }
  } catch {
    // deleted or missing path — lint-staged may pass removed paths; ignore
  }
}

if (failed) {
  console.error(
    "\nSee docs/git-workflow.md and docs/git-rules.md — use .gitignore, run installs locally, never commit dependencies or build output.\n",
  );
  process.exit(1);
}
