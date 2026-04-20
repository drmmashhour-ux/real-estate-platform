/**
 * UI-facing view model — formatting happens here, not in route fragments.
 */

import type { CertificateOfLocationSummary } from "./certificate-of-location.types";
import { brokerAiFlags } from "@/config/feature-flags";
import { getCertificateOfLocationChecklist } from "./certificate-of-location.checklist";
import { buildCertificateOfLocationNextSteps } from "./certificate-of-location-guidance.service";
import { evaluateCertificateOfLocation } from "./certificate-of-location-evaluator.service";
import { buildCertificateOfLocationContextFromDb } from "./certificate-of-location-context.service";
import type { BuildCertificateOfLocationContextParams } from "./certificate-of-location-context.service";
import { buildCertificateWorkflowActionsAvailability } from "./certificate-of-location-workflow.service";

export type CertificateBadgeTone = "neutral" | "info" | "warn" | "danger" | "ok";

export type CertificateOfLocationViewModel = {
  headline: string;
  statusBadge: { label: string; tone: CertificateBadgeTone };
  readinessBadge: { label: string; tone: CertificateBadgeTone };
  riskBadge: { label: string; tone: CertificateBadgeTone };
  checklistRows: Array<{
    itemId: string;
    label: string;
    passed: boolean;
    message: string;
    severity: "info" | "warning" | "critical";
  }>;
  blockingIssues: string[];
  warnings: string[];
  nextSteps: string[];
  disclaimer: string[];
  emptyState?: string;
  /** V2 — safe copy only; no raw document fields. */
  explainabilityReasons?: string[];
  contributingSignals?: string[];
  timelineSummary?: string | null;
  consistencyMismatchLabels?: string[];
  workflowActionsAvailable?: {
    requestUpload: boolean;
    markReviewed: boolean;
    sendToAdmin: boolean;
  };
};

function toneForReadiness(level: CertificateOfLocationSummary["readinessLevel"]): CertificateBadgeTone {
  if (level === "ready_for_broker_review") return "ok";
  if (level === "partial") return "info";
  if (level === "review_required") return "warn";
  return "danger";
}

function toneForRisk(level: CertificateOfLocationSummary["riskLevel"]): CertificateBadgeTone {
  if (level === "low") return "ok";
  if (level === "guarded") return "info";
  if (level === "elevated") return "warn";
  return "danger";
}

function toneForStatus(status: CertificateOfLocationSummary["status"]): CertificateBadgeTone {
  if (status === "appears_current") return "ok";
  if (status === "parsed") return "info";
  if (status === "uploaded") return "info";
  if (status === "may_be_outdated") return "warn";
  if (status === "needs_review") return "warn";
  if (status === "rejected") return "danger";
  return "danger";
}

function humanStatus(status: CertificateOfLocationSummary["status"]): string {
  const map: Record<CertificateOfLocationSummary["status"], string> = {
    missing: "missing",
    uploaded: "present (uploaded)",
    parsed: "present (parsed metadata)",
    needs_review: "needs_review",
    appears_current: "present",
    may_be_outdated: "may_be_outdated",
    rejected: "rejected",
  };
  return map[status] ?? status;
}

export function buildCertificateOfLocationViewModel(summary: CertificateOfLocationSummary): CertificateOfLocationViewModel {
  try {
    const disclaimer = [
      "This panel is workflow support only. It is not legal advice and does not confirm that a certificate is legally sufficient.",
      "Land surveyors, notaries, brokers, and lawyers remain responsible for legal sufficiency and interpretation.",
    ];

    if (!summary.listingId) {
      return {
        headline: "Certificate of location",
        statusBadge: { label: "unknown", tone: "neutral" },
        readinessBadge: { label: "unknown", tone: "neutral" },
        riskBadge: { label: "unknown", tone: "neutral" },
        checklistRows: [],
        blockingIssues: [],
        warnings: [],
        nextSteps: [],
        disclaimer,
        emptyState: "Listing context is missing — certificate readiness cannot be evaluated.",
      };
    }

    const defById = new Map(
      getCertificateOfLocationChecklist({
        listingId: summary.listingId,
      }).map((d) => [d.id, d] as const),
    );
    const checklistRows = summary.checklistResults.map((r) => ({
      itemId: r.itemId,
      label: defById.get(r.itemId)?.label ?? r.itemId.replace(/_/g, " "),
      passed: r.passed,
      message: r.message,
      severity: r.severity,
    }));

    let timelineSummary: string | null = null;
    if (brokerAiFlags.brokerAiCertificateOfLocationV2 && summary.timelineSignals) {
      const ts = summary.timelineSignals;
      if (!ts.hasIssueDate) {
        timelineSummary = "Structured certificate issue date is not available — age cannot be assessed here.";
      } else if (ts.flaggedAsPotentiallyOutdated) {
        timelineSummary =
          typeof ts.estimatedAgeDays === "number"
            ? `Structured issue date implies an approximate age of ${ts.estimatedAgeDays} days — stale-date warning only (not a legal determination).`
            : "Stale-date warning signal present — manual verification recommended.";
      }
    }

    const vm: CertificateOfLocationViewModel = {
      headline: "Certificate of location readiness",
      statusBadge: { label: humanStatus(summary.status), tone: toneForStatus(summary.status) },
      readinessBadge: { label: summary.readinessLevel, tone: toneForReadiness(summary.readinessLevel) },
      riskBadge: { label: summary.riskLevel, tone: toneForRisk(summary.riskLevel) },
      checklistRows,
      blockingIssues: summary.blockingIssues.slice(0, 12),
      warnings: summary.warnings.slice(0, 12),
      nextSteps: summary.nextSteps.slice(0, 5),
      disclaimer,
      ...(brokerAiFlags.brokerAiCertificateOfLocationV2 ?
        {
          explainabilityReasons: summary.explainability?.reasons?.slice(0, 14),
          contributingSignals: summary.explainability?.contributingSignals?.slice(0, 14),
          timelineSummary,
          consistencyMismatchLabels: summary.consistencySignals?.mismatches?.slice(0, 10),
          workflowActionsAvailable: buildCertificateWorkflowActionsAvailability(summary),
        }
      : {}),
    };
    return vm;
  } catch {
    return {
      headline: "Certificate of location",
      statusBadge: { label: "unknown", tone: "neutral" },
      readinessBadge: { label: "unknown", tone: "neutral" },
      riskBadge: { label: "unknown", tone: "neutral" },
      checklistRows: [],
      blockingIssues: [],
      warnings: [],
      nextSteps: [],
      disclaimer: ["Evaluation fallback — manual review recommended."],
      emptyState: "Unable to build view model.",
    };
  }
}

export async function loadCertificateOfLocationPresentation(
  params: BuildCertificateOfLocationContextParams,
): Promise<{ summary: CertificateOfLocationSummary; viewModel: CertificateOfLocationViewModel }> {
  const ctx = await buildCertificateOfLocationContextFromDb({
    listingId: params.listingId,
    brokerFlow: params.brokerFlow,
    offerStage: params.offerStage,
  });
  const evaluated = evaluateCertificateOfLocation(ctx);
  const steps = buildCertificateOfLocationNextSteps(evaluated);
  const summary: CertificateOfLocationSummary = { ...evaluated, nextSteps: steps };
  return {
    summary,
    viewModel: buildCertificateOfLocationViewModel(summary),
  };
}
