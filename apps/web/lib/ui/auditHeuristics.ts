import fs from "node:fs";
import path from "node:path";

import { uiChecklist } from "@/lib/ui/checklist";

export type UIAuditResult = {
  score: number;
  passed: string[];
  failed: string[];
};

const RE_SPACING = /\b(p|m|px|py|pt|pb|pl|pr|mt|mb|ml|mr|mx|my|gap|space-x|space-y)-/g;
const RE_TYPE = /\btext-(2xl|3xl|4xl|5xl|xl|lg|sm|base)\b/g;
const RE_MAXW = /\bmax-w-/g;
const RE_HOVER = /\bhover:\w+/g;
const RE_LOAD = /animate-pulse|loading|Loader|Spinner|skeleton|Skeleton|isLoading/gi;
const RE_ERR = /ErrorBoundary|fallback|Something went wrong|error state/i;
const RE_MOB = /(?:^|["'`\s{(])(sm|md|lg|xl|2xl):/g;
const RE_COLOR = /#D4AF37|#d4af37|amber-|\bblack\b|zinc-|\bgold\b/gi;

const MAX_FILES = 220;

const TEXT_EXT = [".tsx", ".ts", ".jsx", ".js"];

function shouldScan(name: string): boolean {
  return TEXT_EXT.some((e) => name.endsWith(e));
}

function walkCollect(root: string, out: string[], cap: number): void {
  if (out.length >= cap || !fs.existsSync(root)) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") && e.name !== ".") continue;
    if (e.name === "node_modules" || e.name === ".next" || e.name === "dist" || e.name === "out") continue;
    const p = path.join(root, e.name);
    if (e.isDirectory()) {
      walkCollect(p, out, cap);
      if (out.length >= cap) return;
    } else if (shouldScan(e.name)) {
      out.push(p);
      if (out.length >= cap) return;
    }
  }
}

function readChunk(file: string, max = 64_000): string {
  try {
    const s = fs.readFileSync(file, "utf8");
    return s.length > max ? s.slice(0, max) : s;
  } catch {
    return "";
  }
}

function appErrorFileExists(cwd: string): boolean {
  return (
    fs.existsSync(path.join(cwd, "app", "error.tsx")) ||
    fs.existsSync(path.join(cwd, "app", "error.ts")) ||
    fs.existsSync(path.join(cwd, "src", "app", "error.tsx"))
  );
}

function performancePass(): boolean {
  if (process.env.UI_AUDIT_PERF_PASS === "1") return true;
  if (process.env.UI_AUDIT_PERF_FAIL === "1") return false;
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return false;
}

/**
 * Heuristic, repo-local UI audit. Flags:
 * - `UI_AUDIT_PERF_PASS=1` — mark **Fast page load** as pass in production/staging.
 * - `UI_AUDIT_PERF_FAIL=1` — fail perf in dev.
 * - `UI_AUDIT_SMOKE_FAIL_ALL=1` — fail every row (e.g. test launch gate).
 */
export async function runUIAudit(): Promise<UIAuditResult> {
  const cwd = process.cwd();
  const targets = [path.join(cwd, "app"), path.join(cwd, "components")].filter((p) => fs.existsSync(p));

  const files: string[] = [];
  for (const t of targets) {
    walkCollect(t, files, MAX_FILES);
    if (files.length >= MAX_FILES) break;
  }

  const bundle = files.map((f) => readChunk(f)).join("\n");
  const errRoute = appErrorFileExists(cwd) || /error\.tsx|error\.ts/.test(files.join(" "));

  const checks: { label: string; ok: boolean }[] = [
    { label: uiChecklist[0]!, ok: (bundle.match(RE_SPACING) || []).length >= 12 },
    { label: uiChecklist[1]!, ok: (bundle.match(RE_TYPE) || []).length >= 8 },
    { label: uiChecklist[2]!, ok: (bundle.match(RE_MAXW) || []).length >= 6 },
    { label: uiChecklist[3]!, ok: (bundle.match(RE_HOVER) || []).length >= 8 },
    { label: uiChecklist[4]!, ok: (bundle.match(RE_LOAD) || []).length >= 2 },
    { label: uiChecklist[5]!, ok: RE_ERR.test(bundle) || errRoute },
    { label: uiChecklist[6]!, ok: (bundle.match(RE_MOB) || []).length >= 20 },
    { label: uiChecklist[7]!, ok: performancePass() },
    { label: uiChecklist[8]!, ok: (bundle.match(RE_COLOR) || []).length >= 5 },
  ];

  if (process.env.UI_AUDIT_SMOKE_FAIL_ALL === "1") {
    for (const c of checks) c.ok = false;
  }

  const passed = checks.filter((c) => c.ok).map((c) => c.label);
  const failed = checks.filter((c) => !c.ok).map((c) => c.label);
  const score = Math.round((passed.length / checks.length) * 100);

  if (process.env.NODE_ENV === "development" && score < 80) {
    // eslint-disable-next-line no-console -- Order 52.1 dev signal
    console.warn(
      `[ui-audit] score ${score}/100 (threshold 80). Failed: ${failed.length ? failed.join(" · ") : "—"}`
    );
  }

  return { score, passed, failed };
}
