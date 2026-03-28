import type { AuditResult, StabilizationIssue } from "./types";
import { walkTsFiles, readTextSafe, relWeb } from "./fsUtils";

/** One RegExp per `code` — no duplicate rules. */
const HEAVY_PATTERNS: readonly {
  re: RegExp;
  code: string;
  message: string;
  severity: StabilizationIssue["severity"];
}[] = [
  {
    re: /\.findMany\s*\(\s*\{[^}]{0,400}\}/,
    code: "PERF_FINDMANY",
    message: "findMany without obvious take/skip in snippet — verify pagination",
    severity: "LOW",
  },
  {
    re: /prisma\.\$queryRawUnsafe\s*\(/,
    code: "PERF_RAW_UNSAFE",
    message: "Raw unsafe SQL — verify inputs are controlled",
    severity: "MEDIUM",
  },
  {
    re: /useEffect\s*\(\s*\(\)\s*=>\s*\{[^}]{0,200}fetch\s*\(/,
    code: "PERF_EFFECT_FETCH",
    message: "fetch inside useEffect — ensure deduping / SWR where needed",
    severity: "LOW",
  },
] as const;

const LISTING_PATH_RE = /app\/(bnhub|stays)\/|listing/i;

export function runPerformanceAudit(webRoot: string): AuditResult {
  const issues: StabilizationIssue[] = [];
  const files = walkTsFiles(webRoot).filter(
    (f) => !f.includes("node_modules") && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx")
  );

  for (const file of files) {
    const rel = relWeb(webRoot, file);
    const content = readTextSafe(file);
    if (!content || content.length > 80_000) continue;
    const isListing = LISTING_PATH_RE.test(rel);
    for (const { re, code, message, severity } of HEAVY_PATTERNS) {
      if (re.test(content)) {
        issues.push({
          severity: isListing && code === "PERF_FINDMANY" ? "MEDIUM" : severity,
          code,
          message,
          file: rel,
        });
      }
    }
  }

  const capped = issues.slice(0, 60);
  return {
    name: "performanceAudit",
    issues: capped,
    stats: { filesScannedHeuristic: files.length, hintsReported: capped.length, hintsTotal: issues.length },
  };
}
