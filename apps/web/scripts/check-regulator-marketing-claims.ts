/**
 * CI: fail if marketing/UI source files contain forbidden regulator-endorsement phrases.
 * @see lib/compliance/oaciq/regulator-claim-guard.ts
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { REGULATOR_FORBIDDEN_MARKETING_PHRASES } from "../lib/compliance/oaciq/regulator-claim-guard";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const WEB_ROOT = join(__dirname, "..");

const SCAN_EXTENSIONS = new Set([".tsx", ".ts", ".jsx", ".js", ".md", ".mdx", ".html"]);

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".git",
]);

const SKIP_FILE_SUBSTRINGS = [
  "regulator-claim-guard.ts",
  "check-regulator-marketing-claims.ts",
];

function* walkFiles(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const full = join(dir, name);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      yield* walkFiles(full);
    } else if (st.isFile()) {
      const ext = name.slice(name.lastIndexOf("."));
      if (SCAN_EXTENSIONS.has(ext)) yield full;
    }
  }
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").toLowerCase();
}

function main(): void {
  const violations: { file: string; phrase: string }[] = [];

  for (const file of walkFiles(WEB_ROOT)) {
    const rel = relative(WEB_ROOT, file);
    if (SKIP_FILE_SUBSTRINGS.some((s) => rel.includes(s))) continue;

    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const norm = normalize(content);
    for (const phrase of REGULATOR_FORBIDDEN_MARKETING_PHRASES) {
      if (norm.includes(phrase)) {
        violations.push({ file: rel, phrase });
      }
    }
  }

  if (violations.length > 0) {
    console.error("[check-regulator-marketing-claims] Forbidden phrases found:\n");
    for (const v of violations) {
      console.error(`  ${v.phrase}  →  ${v.file}`);
    }
    console.error(
      "\nUse neutral positioning (e.g. operated by a licensed broker; aligned with Québec regulations). See regulator-claim-guard.ts\n",
    );
    process.exit(1);
  }

  console.log("[check-regulator-marketing-claims] OK");
}

main();
