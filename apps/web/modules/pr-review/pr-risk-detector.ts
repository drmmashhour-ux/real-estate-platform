/**
 * LECIPM Deployment Safety v1 — heuristic PR risk analysis (git diff + path rules).
 * Does not execute code; never exposes secrets — only flags suspicious *patterns* in patches.
 */

export type PrRiskLevel = "low" | "medium" | "high";
export type PrRecommendation = "SAFE" | "REVIEW_REQUIRED" | "BLOCK";

export type PrRiskDetectorInput = {
  /** Repo-relative paths under `apps/web/` (forward slashes). */
  changedFiles: { path: string; status: "A" | "M" | "D" | "R" | "C" | "T" | "U" | "?" }[];
  /** Per-file insertions + deletions from `git diff --numstat`. */
  lineStats: Map<string, { add: number; del: number }>;
  /** Unified or raw diff text for `+` line secret heuristics (optional). */
  patchText?: string;
};

/** Critical areas — relative to `apps/web/`. */
export const WEB_CRITICAL_PREFIXES = [
  "app/api/stripe",
  "app/api/bookings",
  "modules/deals",
  "modules/documents",
  "lib/auth",
  "lib/access-control",
] as const;

const LARGE_FILE_LINES = 400;
const HUGE_FILE_LINES = 900;

const SECRET_LINE_PATTERNS: RegExp[] = [
  /\bsk_live_[a-zA-Z0-9]{8,}/,
  /\bsk_test_[a-zA-Z0-9]{8,}/,
  /\bwhsec_[a-zA-Z0-9]{8,}/,
  /STRIPE_SECRET_KEY\s*=\s*["']?[^"'\s]+/i,
  /DATABASE_URL\s*=\s*postgres(ql)?:\/\/[^"'\s]+/i,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

const AUTH_HINTS = /requireAdmin|requireSession|getServerSession|auth\(|unauthorized|forbiddenSession|assertAuthenticated/i;

function normalizeWebPath(p: string): string {
  return p.replace(/\\/g, "/");
}

/** Path relative to `apps/web/` (no leading slash). */
function toWebRelative(repoPath: string): string {
  const n = normalizeWebPath(repoPath);
  return n.replace(/^apps\/web\//, "");
}

function isCriticalPath(webRelative: string): boolean {
  const n = webRelative.toLowerCase();
  return WEB_CRITICAL_PREFIXES.some((pre) => n === pre || n.startsWith(`${pre}/`) || n.startsWith(pre));
}

function extractAddedLines(patch: string): string[] {
  const out: string[] = [];
  for (const line of patch.split("\n")) {
    if (line.startsWith("+++ ") || line.startsWith("--- ")) continue;
    if (line.startsWith("+") && !line.startsWith("+++")) {
      out.push(line.slice(1));
    }
  }
  return out;
}

function scanLinesForSecretPatterns(lines: string[]): string[] {
  const hits: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    for (const re of SECRET_LINE_PATTERNS) {
      if (re.test(trimmed)) {
        hits.push("Potential secret material in added lines (pattern matched).");
        return hits;
      }
    }
  }
  return hits;
}

/** Heuristic: new/modified API route without obvious auth guard. */
function missingAuthHeuristic(path: string, patchText: string): boolean {
  if (!path.includes("app/api/") || !path.endsWith("route.ts")) return false;
  const critical =
    path.includes("/api/stripe/") ||
    path.includes("/api/bookings/") ||
    path.includes("/api/admin/");
  if (!critical) return false;
  const chunk = patchText.length > 120_000 ? patchText.slice(-120_000) : patchText;
  return !AUTH_HINTS.test(chunk);
}

export function analyzePrRisk(input: PrRiskDetectorInput): {
  riskLevel: PrRiskLevel;
  criticalChanges: string[];
  warnings: string[];
  recommendation: PrRecommendation;
} {
  const criticalChanges: string[] = [];
  const warnings: string[] = [];

  for (const f of input.changedFiles) {
    const webRel = toWebRelative(f.path);

    if (f.status === "D" && isCriticalPath(webRel)) {
      warnings.push(`Deleted critical file: ${webRel}`);
    }
    if (f.status !== "D" && isCriticalPath(webRel)) {
      criticalChanges.push(`${f.status}: ${webRel}`);
    }
  }

  for (const [path, st] of input.lineStats) {
    const webRel = toWebRelative(path);
    const total = st.add + st.del;
    if (total >= HUGE_FILE_LINES && isCriticalPath(webRel)) {
      warnings.push(`Very large diff in critical area (${total} lines): ${webRel}`);
    } else if (total >= LARGE_FILE_LINES) {
      warnings.push(`Large diff (${total} lines): ${webRel}`);
    }
  }

  let risk: PrRiskLevel = "low";
  if (criticalChanges.length > 0) risk = "medium";
  if (warnings.some((w) => w.includes("Very large diff in critical"))) risk = "high";
  if (criticalChanges.length > 3) risk = "high";

  const added = input.patchText ? extractAddedLines(input.patchText) : [];
  const secretHits = scanLinesForSecretPatterns(added);
  if (secretHits.length) {
    warnings.push(...secretHits);
    risk = "high";
  }

  if (input.patchText) {
    for (const f of input.changedFiles) {
      if (f.status === "D") continue;
      const webRel = toWebRelative(f.path);
      if (missingAuthHeuristic(webRel, input.patchText)) {
        warnings.push(`API route may lack explicit auth guard (verify manually): ${webRel}`);
        if (risk === "low") risk = "medium";
      }
    }
  }

  let recommendation: PrRecommendation = "SAFE";
  if (secretHits.length || warnings.some((w) => w.startsWith("Deleted critical"))) {
    recommendation = "BLOCK";
  } else if (risk === "high" || criticalChanges.length > 0) {
    recommendation = "REVIEW_REQUIRED";
  } else if (risk === "medium" || warnings.length > 0) {
    recommendation = "REVIEW_REQUIRED";
  }

  return {
    riskLevel: risk,
    criticalChanges,
    warnings,
    recommendation,
  };
}
