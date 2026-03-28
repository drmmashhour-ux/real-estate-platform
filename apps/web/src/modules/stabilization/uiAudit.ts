import { join } from "node:path";
import { existsSync } from "node:fs";
import type { AuditResult, StabilizationIssue } from "./types";
import { readTextSafe, relWeb } from "./fsUtils";

const CRITICAL_PAGES = [
  "app/page.tsx",
  "app/bnhub/page.tsx",
  "app/bnhub/[id]/page.tsx",
  "app/stays/[slug]/page.tsx",
  "app/auth/login/page.tsx",
  "app/admin/page.tsx",
];

export function runUiAudit(webRoot: string): AuditResult {
  const issues: StabilizationIssue[] = [];
  let exportDefault = 0;
  let suspiciousEmpty = 0;

  for (const rel of CRITICAL_PAGES) {
    const p = join(webRoot, rel);
    const src = readTextSafe(p);
    if (src == null) {
      issues.push({
        severity: "HIGH",
        code: "UI_PAGE_MISSING",
        message: `Critical UI page missing: ${rel}`,
        file: rel,
      });
      continue;
    }
    if (!/\bexport\s+default\s+function\b/.test(src) && !/\bexport\s+default\s+\w+/.test(src)) {
      issues.push({
        severity: "MEDIUM",
        code: "UI_NO_DEFAULT_EXPORT",
        message: "Expected default export component",
        file: rel,
      });
    } else {
      exportDefault += 1;
    }
    if (src.length < 120 && !rel.includes("[id]") && !rel.includes("[slug]")) {
      suspiciousEmpty += 1;
      issues.push({
        severity: "LOW",
        code: "UI_THIN_PAGE",
        message: "Page source is very short — confirm not a stub",
        file: rel,
      });
    }
  }

  const appRoot = join(webRoot, "app");
  const loadingTsx = join(appRoot, "loading.tsx");
  const errorTsx = join(appRoot, "error.tsx");
  if (!existsSync(loadingTsx)) {
    issues.push({
      severity: "LOW",
      code: "UI_ROOT_LOADING",
      message: "No app/loading.tsx — optional global loading shell",
    });
  }
  if (!existsSync(errorTsx)) {
    issues.push({
      severity: "LOW",
      code: "UI_ROOT_ERROR",
      message: "No app/error.tsx — optional global error boundary",
    });
  }

  return {
    name: "uiAudit",
    issues,
    stats: {
      criticalPagesWithDefaultExport: exportDefault,
      thinPageHints: suspiciousEmpty,
    },
  };
}
