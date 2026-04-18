/**
 * IP + security governance snapshot — read-only; derived from repo docs + light heuristics.
 * Does not assert legal compliance or certification.
 */
import fs from "fs";
import path from "path";
import {
  fileExists,
  keywordCheckboxLinesComplete,
  parseWholeDocCheckboxStats,
  readFileSafe,
  sectionMostlyComplete,
} from "./doc-checkbox";
import { getMonorepoRoot } from "./repo-root";
import { computeGovernanceRisk } from "./ip-security-risk.service";
import type { IpSecurityGovernanceSnapshot } from "./ip-security-governance.types";

export type { IpSecurityGovernanceSnapshot, TrademarkStatus } from "./ip-security-governance.types";

function countApiRouteFiles(appRoot: string, maxFiles = 400): number {
  let n = 0;
  const apiDir = path.join(appRoot, "app", "api");
  function walk(d: string) {
    if (n >= maxFiles) return;
    let ents: fs.Dirent[];
    try {
      ents = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      if (n >= maxFiles) return;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name === "route.ts") n++;
    }
  }
  try {
    walk(apiDir);
  } catch {
    return 0;
  }
  return n;
}

function deriveProductionReadyScore(
  launchReadme: string | null,
): { score: number | null; note: string | null } {
  if (!launchReadme) {
    return { score: null, note: "Launch readiness doc not found at expected path." };
  }
  const { checked, unchecked } = parseWholeDocCheckboxStats(launchReadme);
  const t = checked + unchecked;
  if (t === 0) return { score: null, note: "No checkboxes parsed in launch readiness doc." };
  return {
    score: Math.round((checked / t) * 100) / 100,
    note: `Checkbox completion in ${LAUNCH_READINESS_REL} (observational).`,
  };
}

const LAUNCH_READINESS_REL = "docs/launch/LAUNCH-READINESS-REPORT.md";

export type GovernanceSnapshotOpts = {
  /** Test override for monorepo root (contains `docs/`). */
  repoRoot?: string;
  /** Test override for `apps/web` path (for API route counting). */
  appRoot?: string;
};

export function getIpSecurityGovernanceSnapshot(opts: GovernanceSnapshotOpts = {}): IpSecurityGovernanceSnapshot {
  const root = getMonorepoRoot(opts.repoRoot);
  const appRoot = opts.appRoot ?? process.cwd();
  const docs = (...p: string[]) => path.join(root, "docs", ...p);

  const legal = {
    termsOfServicePresent: fileExists(docs("legal", "TERMS-OF-SERVICE-DRAFT.md")),
    privacyPolicyPresent: fileExists(docs("legal", "PRIVACY-POLICY-DRAFT.md")),
    ndaTemplatesPresent:
      fileExists(docs("legal", "NDA-MUTUAL-DRAFT.md")) &&
      fileExists(docs("legal", "NDA-CONTRACTOR-IP-ASSIGNMENT-DRAFT.md")),
    acceptableUsePresent: fileExists(docs("legal", "ACCEPTABLE-USE-POLICY-DRAFT.md")),
    law25ChecklistPresent: fileExists(docs("legal", "LAW25-PRIVACY-CHECKLIST.md")),
  };

  const routeCount = countApiRouteFiles(appRoot);
  const proprietaryLogicProtected = routeCount >= 12;
  const ip = {
    ipChecklistPresent: fileExists(docs("legal", "IP-PROTECTION-CHECKLIST.md")),
    proprietaryLogicProtected,
    proprietaryLogicHeuristicNote: `Counted ${routeCount} Next.js \`app/api/**/route.ts\` files under ${appRoot} (heuristic; threshold ≥12).`,
    trademarkStatus: "manual_review_required" as TrademarkStatus,
  };

  const prodSecPath = docs("security", "PROD-SECURITY-CHECKLIST.md");
  const prodSec = readFileSafe(prodSecPath);
  const aiLegalPath = docs("security", "ai-and-legal-safety.md");
  const prSecurityGatesPath = docs("security", "pr-security-gates.md");
  const prGates = readFileSafe(prSecurityGatesPath);
  const docsReadable = prodSec !== null;

  const derivationNotes: string[] = [];
  if (prodSec) {
    derivationNotes.push("Security flags derived primarily from docs/security/PROD-SECURITY-CHECKLIST.md section checkbox ratios.");
  } else {
    derivationNotes.push("PROD-SECURITY-CHECKLIST.md not readable — security flags defaulted false.");
  }

  const prGatesBoxes = prGates ? parseWholeDocCheckboxStats(prGates) : { checked: 0, unchecked: 0 };
  const aiAdminDocPresent = fileExists(aiLegalPath);
  const aiAdminReviewDone =
    aiAdminDocPresent &&
    (prGatesBoxes.checked > 0 ||
      (prodSec ? sectionMostlyComplete(prodSec, "## Monitoring", 0.35) : false));

  const security = {
    apiSecurityReviewed: prodSec ? sectionMostlyComplete(prodSec, "## API & abuse", 0.55) : false,
    authReviewDone: prodSec
      ? sectionMostlyComplete(prodSec, "## Identity & access", 0.5) &&
        sectionMostlyComplete(prodSec, "## Sessions & cookies", 0.45)
      : false,
    stripeSecurityReviewed: prodSec
      ? keywordCheckboxLinesComplete(prodSec, "## Identity & access", /stripe/i)
      : false,
    dbSecurityReviewed: prodSec ? sectionMostlyComplete(prodSec, "## Database TLS", 0.55) : false,
    aiAdminReviewDone,
    secretsChecklistDone: prodSec ? sectionMostlyComplete(prodSec, "## Secrets in repo", 0.55) : false,
    derivationNotes,
  };

  if (aiAdminDocPresent) {
    derivationNotes.push(
      "AI/admin: requires ai-and-legal-safety.md plus either PR security gates checkboxes started or Monitoring section progress in PROD checklist.",
    );
  }

  const launchContent = readFileSafe(path.join(root, LAUNCH_READINESS_REL));
  const pr = deriveProductionReadyScore(launchContent);

  const production = {
    productionReadyScore: pr.score,
    productionReadyNote: pr.note,
    criticalIncidentsCount: 0,
    alertCount: 0,
    incidentsNote:
      "Incident/alert counts are not wired to live telemetry in this snapshot — observational placeholder.",
  };

  const structuralGaps: string[] = [];
  const warnings: string[] = [];
  if (!legal.termsOfServicePresent) structuralGaps.push("Terms of service draft missing from docs/legal/");
  if (!legal.privacyPolicyPresent) structuralGaps.push("Privacy policy draft missing from docs/legal/");
  if (!legal.law25ChecklistPresent) warnings.push("Law 25 operational checklist file missing — Québec privacy posture not documented in-repo.");
  if (!security.stripeSecurityReviewed) structuralGaps.push("Stripe-related checklist items in PROD security doc may be incomplete.");
  if (!security.authReviewDone) structuralGaps.push("Identity/session checklist sections may be incomplete.");
  if (!security.apiSecurityReviewed) structuralGaps.push("API & abuse checklist section may be incomplete.");
  if (pr.score != null && pr.score < 0.45) warnings.push("Launch readiness checkbox ratio is low — review docs/launch/LAUNCH-READINESS-REPORT.md.");
  if (!docsReadable) warnings.push("Could not read production security checklist — verify deployment includes repo docs.");

  const risk = computeGovernanceRisk({ legal, security, production });
  const criticalGaps = [...new Set([...structuralGaps, ...risk.topRisks])].slice(0, 20);

  return {
    legal,
    ip,
    security,
    production,
    summary: {
      overallRiskLevel: risk.riskLevel,
      criticalGaps,
      warnings,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      repoRootUsed: root,
      docsReadable,
    },
  };
}
