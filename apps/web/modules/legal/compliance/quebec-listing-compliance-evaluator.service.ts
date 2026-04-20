/**
 * Québec listing compliance — wraps legacy evaluator with Phase 8 readiness scoring + supplemental checks.
 * Deterministic; no throws; no side effects.
 */

import { evaluateQuebecCompliance, type QuebecComplianceEvaluatorInput } from "./quebec-compliance-evaluator.service";
import type { QuebecComplianceCheckResult, QuebecComplianceChecklistResult } from "./quebec-compliance.types";
import { resolveDomainsForListing } from "./listing-publish-compliance.service";
import { getQuebecListingChecklist, type QuebecListingChecklistDefinition } from "./quebec-listing-checklist.definitions";
import type { PropertyPublishComplianceSummary } from "../scoring/property-legal-risk.types";

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export type QuebecListingComplianceEvaluationResult = {
  listingId: string;
  legacyChecklist: QuebecComplianceChecklistResult;
  /** Effective checklist rows after supplemental checks */
  effectiveResults: QuebecComplianceCheckResult[];
  supplementalOnly: Array<{
    id: string;
    passed: boolean;
    severity: "info" | "warning" | "critical";
    blocking: boolean;
    message: string;
  }>;
  readinessScore: number;
  blockingIssues: string[];
  warnings: string[];
  requiredChecklistPassed: boolean;
  evidenceSummary: Record<string, string | number | boolean | null>;
  definitionRows: QuebecListingChecklistDefinition[];
};

function resilienceScoreFromOutcome(
  passed: boolean,
  severity: "info" | "warning" | "critical",
  blocking: boolean,
): number {
  if (passed) return 0;
  if (severity === "critical" && blocking) return 20;
  if (severity === "critical") return 12;
  if (severity === "warning") return 4;
  return 2;
}

function evaluateSupplementalListingStatus(ctx: QuebecComplianceEvaluatorInput): {
  passed: boolean;
  message: string;
} {
  try {
    const mod = String(ctx.listing.moderationStatus ?? "").toUpperCase();
    const passed = mod !== "REJECTED";
    return {
      passed,
      message: passed
        ? "Moderation posture allows publish progression."
        : "Listing requires review — publishing is blocked until moderation is resolved.",
    };
  } catch {
    return { passed: false, message: "Moderation posture could not be confirmed — verification required." };
  }
}

function mergeEvaluatorDomains(input: QuebecComplianceEvaluatorInput): QuebecComplianceEvaluatorInput {
  const domains = resolveDomainsForListing(input.listing);
  return { ...input, domains, primaryDomain: input.primaryDomain ?? "listing" };
}

/**
 * Full Québec listing compliance evaluation with Phase 8 readiness scoring rules.
 */
export function evaluateQuebecListingCompliance(params: {
  evaluatorInput: QuebecComplianceEvaluatorInput;
  /** When set and not `ca_qc`, Québec checklist engine is skipped (availability note only; not a failure). */
  platformRegionCode?: string;
}): QuebecListingComplianceEvaluationResult {
  const listingId = params.evaluatorInput.listing.id ?? "unknown";
  const emptySummary: QuebecListingComplianceEvaluationResult = {
    listingId,
    legacyChecklist: {
      domain: "listing",
      items: [],
      results: [],
      readinessScore: 0,
      blockingIssues: ["qc_evaluator_fallback"],
      warnings: [],
    },
    effectiveResults: [],
    supplementalOnly: [],
    readinessScore: 0,
    blockingIssues: ["qc_evaluator_fallback"],
    warnings: [],
    requiredChecklistPassed: false,
    evidenceSummary: {},
    definitionRows: [],
  };

  try {
    const pr = typeof params.platformRegionCode === "string" ? params.platformRegionCode.trim() : "";
    if (pr && pr !== "ca_qc") {
      const lid = params.evaluatorInput.listing.id ?? "unknown";
      return {
        listingId: lid,
        legacyChecklist: {
          domain: "listing",
          items: [],
          results: [],
          readinessScore: 100,
          blockingIssues: [],
          warnings: [],
        },
        effectiveResults: [],
        supplementalOnly: [],
        readinessScore: 100,
        blockingIssues: [],
        warnings: ["quebec_compliance_evaluator_not_applicable_outside_ca_qc"],
        requiredChecklistPassed: true,
        evidenceSummary: { skippedNonQuebecRegion: true, platformRegionCode: pr },
        definitionRows: [],
      };
    }

    const mergedInput = mergeEvaluatorDomains(params.evaluatorInput);
    const legacy = evaluateQuebecCompliance(mergedInput);
    const supplementalStatus = evaluateSupplementalListingStatus(mergedInput);

    const supplementalOnly = [
      {
        id: "ql_core_listing_status_allows_publish",
        passed: supplementalStatus.passed,
        severity: "critical" as const,
        blocking: true,
        message: supplementalStatus.message,
      },
    ];

    const definitionRows = getQuebecListingChecklist({ evaluatorInput: mergedInput });

    /** Map legacy results by item id */
    const byLegacyId = new Map<string, QuebecComplianceCheckResult>();
    for (let i = 0; i < legacy.items.length; i++) {
      const item = legacy.items[i];
      const res = legacy.results[i];
      if (item && res) byLegacyId.set(item.id, res);
    }

    const effectiveResults: QuebecComplianceCheckResult[] = [...legacy.results];

    /** Supplemental synthetic results appended as pseudo-results */
    for (const s of supplementalOnly) {
      effectiveResults.push({
        itemId: s.id,
        passed: s.passed,
        severity: s.severity,
        message: s.message,
        evidenceFound: s.passed,
      });
    }

    let readiness = 100;
    const blocking = new Set<string>();
    const warns = new Set<string>();

    for (const item of legacy.items) {
      const res = legacy.results.find((r) => r.itemId === item.id);
      if (!res || res.passed) continue;
      readiness -= resilienceScoreFromOutcome(false, item.severity, item.blocking);
      if (item.blocking) blocking.add(item.id);
      else warns.add(item.id);
    }

    for (const s of supplementalOnly) {
      if (s.passed) continue;
      readiness -= resilienceScoreFromOutcome(false, s.severity, s.blocking);
      blocking.add(s.id);
    }

    readiness = clamp(readiness);

    const supplementalBlocking = supplementalOnly.some((s) => !s.passed && s.blocking);
    const legacyBlocking = legacy.blockingIssues.filter((id) => id !== "qc_evaluator_fallback");
    const requiredChecklistPassed =
      legacyBlocking.length === 0 && !supplementalBlocking && !legacy.blockingIssues.includes("qc_evaluator_fallback");

    const blockingIssues = [...new Set([...legacyBlocking, ...(supplementalBlocking ? ["ql_core_listing_status_allows_publish"] : [])])].sort();

    const warnings = [...new Set([...legacy.warnings, ...warns])].sort();

    const fraudCriticalCount = (mergedInput.fraudIndicators ?? []).filter((x) => x.severity === "critical").length;
    const ruleCriticalCount = (mergedInput.ruleResults ?? []).filter((x) => x.severity === "critical").length;

    const evidenceSummary: Record<string, string | number | boolean | null> = {
      legacyReadinessScore: legacy.readinessScore,
      phase8ReadinessScore: readiness,
      supplementalModerationPassed: supplementalStatus.passed,
      checklistDefinitionCount: definitionRows.length,
      fraudCriticalCount,
      ruleCriticalCount,
      legalIntelCriticalCount: mergedInput.legalIntelCriticalCount ?? 0,
    };

    return {
      listingId,
      legacyChecklist: legacy,
      effectiveResults,
      supplementalOnly,
      readinessScore: readiness,
      blockingIssues,
      warnings,
      requiredChecklistPassed,
      evidenceSummary,
      definitionRows,
    };
  } catch {
    return emptySummary;
  }
}

export function buildPropertyPublishComplianceSummary(params: {
  listingId: string;
  evaluation: QuebecListingComplianceEvaluationResult;
  legalRiskScore: number;
}): PropertyPublishComplianceSummary {
  return {
    listingId: params.listingId,
    readinessScore: params.evaluation.readinessScore,
    legalRiskScore: clamp(params.legalRiskScore),
    blockingIssues: [...params.evaluation.blockingIssues],
    warnings: [...params.evaluation.warnings],
    requiredChecklistPassed: params.evaluation.requiredChecklistPassed,
  };
}
