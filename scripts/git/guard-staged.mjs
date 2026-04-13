#!/usr/bin/env node
/**
 * Pre-commit guard: forbidden paths + max staged file size (50 MiB).
 * Invoked by lint-staged with staged file paths as argv.
 */
import fs from "node:fs";
import path from "node:path";

const MAX_BYTES = 50 * 1024 * 1024;
const SECRET_SCAN_MAX_BYTES = 512 * 1024;
const files = process.argv.slice(2).filter((f) => f && !f.startsWith("-"));

const SECRET_SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".env",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
]);

const SECRET_PATTERNS = [
  { re: /sk_live_[0-9a-zA-Z]{10,}/, msg: "Possible Stripe live secret key (sk_live_…)" },
  { re: /rk_live_[0-9a-zA-Z]{10,}/, msg: "Possible Stripe live restricted key (rk_live_…)" },
  { re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, msg: "Possible PEM private key material" },
];

function shouldScanFileForSecrets(rel) {
  const n = rel.split(path.sep).join("/");
  if (!n.includes("apps/web")) return false;
  if (/\.test\.(ts|tsx|js)$/i.test(n)) return false;
  if (/\/docs\//.test(n)) return false;
  if (/\.env\.example$/i.test(n)) return false;
  const ext = path.extname(n).toLowerCase();
  return SECRET_SCAN_EXTENSIONS.has(ext);
}

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
    } else if (st.isFile() && shouldScanFileForSecrets(f) && st.size <= SECRET_SCAN_MAX_BYTES) {
      try {
        const content = fs.readFileSync(f, "utf8");
        for (const { re, msg } of SECRET_PATTERNS) {
          if (re.test(content)) {
            console.error(`\x1b[31m[git-guard]\x1b[0m ${msg}: ${f}`);
            failed = true;
            break;
          }
        }
      } catch {
        /* binary or unreadable — skip */
      }
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
