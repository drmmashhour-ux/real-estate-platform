/**
 * Deterministic certificate-of-location readiness evaluation — not legal advice.
 */

import { brokerAiFlags } from "@/config/feature-flags";
import type {
  CertificateOfLocationChecklistResult,
  CertificateOfLocationContext,
  CertificateOfLocationParsedData,
  CertificateOfLocationReadinessLevel,
  CertificateOfLocationRiskLevel,
  CertificateOfLocationStatus,
  CertificateOfLocationSummary,
} from "./certificate-of-location.types";
import { getCertificateOfLocationChecklist } from "./certificate-of-location.checklist";
import {
  isLikelyStaleIssueDateMs,
  looksLikeCertificateOfLocationType,
  parseIsoDateBoundary,
} from "./certificate-of-location-helpers";
import type { LegalRecordValidationBundleV1 } from "@/modules/legal/records/legal-record.types";
import { validateCertificateConsistency } from "./certificate-of-location-consistency.service";
import { buildCertificateExplainability } from "./certificate-of-location-explainability.service";
import { extractCertificateOfLocationParsedData } from "./certificate-of-location-parser.service";
import { buildCertificateTimelineSignals } from "./certificate-of-location-timeline.service";

function pushUnique(arr: string[], msg: string): void {
  if (!arr.includes(msg)) arr.push(msg);
}

function validationBundleFrom(context: CertificateOfLocationContext): LegalRecordValidationBundleV1 | null {
  const v = context.validationSummary;
  if (!v || typeof v !== "object") return null;
  const b = v as LegalRecordValidationBundleV1;
  if (b.version !== 1 || !b.validation) return null;
  return b;
}

export function evaluateCertificateOfLocation(context: CertificateOfLocationContext): CertificateOfLocationSummary {
  const listingId = context.listingId;
  const availabilityNotes = [...(context.availabilityNotes ?? [])];
  const checklistResults: CertificateOfLocationChecklistResult[] = [];
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  try {
    const defs = getCertificateOfLocationChecklist(context);
    const records = context.legalRecords ?? [];

    const colCompliance = records.find(
      (r) =>
        String(r.recordType) === "compliance_document" &&
        looksLikeCertificateOfLocationType(String((r.parsedData as Record<string, unknown> | undefined)?.certificateType ?? "")),
    );

    const colFallback = records.find(
      (r) =>
        String(r.recordType) === "compliance_document" &&
        String((r.parsedData as Record<string, unknown> | undefined)?.certificateType ?? "")
          .toLowerCase()
          .includes("location"),
    );

    const colRec = colCompliance ?? colFallback;
    const parsed = context.parsedRecordData ?? (colRec?.parsedData as Record<string, unknown> | undefined) ?? null;
    const issueDateStr = parsed && typeof parsed.issueDate === "string" ? parsed.issueDate : null;
    const issueMs = parseIsoDateBoundary(issueDateStr);
    const nowMs = Date.now();

    const bundle = validationBundleFrom(context);
    const criticalRules =
      bundle?.rules?.filter((x) => x.severity === "critical" && x.impact !== "advisory_only").length ?? 0;
    const hasCriticalFailures =
      (bundle?.validation?.missingFields?.length ?? 0) > 0 ||
      (bundle?.validation?.inconsistentFields?.length ?? 0) > 0 ||
      criticalRules > 0;

    let status: CertificateOfLocationStatus = "missing";
    if (colRec) {
      const st = String(colRec.status ?? "").toLowerCase();
      if (st === "rejected") status = "rejected";
      else if (hasCriticalFailures) status = "needs_review";
      else if (st === "uploaded") status = "uploaded";
      else if (st === "parsed" || st === "validated") {
        if (issueMs !== null && !isLikelyStaleIssueDateMs(issueMs, nowMs)) status = "appears_current";
        else if (issueMs !== null && isLikelyStaleIssueDateMs(issueMs, nowMs)) status = "may_be_outdated";
        else status = "parsed";
      } else if (st === "needs_review") status = "needs_review";
      else status = parsed ? "parsed" : "uploaded";
    }

    if (issueMs !== null && isLikelyStaleIssueDateMs(issueMs, nowMs) && status !== "missing" && status !== "rejected") {
      status = "may_be_outdated";
    }

    if (context.changedSinceCertificate === true && status !== "missing" && status !== "rejected") {
      status = "may_be_outdated";
      pushUnique(warnings, "Property changes may require document review.");
    }

    const docPresent = Boolean(colRec);
    const typeMatches =
      docPresent &&
      looksLikeCertificateOfLocationType(
        typeof parsed?.certificateType === "string" ? parsed.certificateType : String(parsed?.certificateType ?? ""),
      );

    const parcelHint =
      parsed &&
      (typeof parsed.parcelId === "string" ||
        typeof (parsed as Record<string, unknown>).cadastre === "string" ||
        typeof (parsed as Record<string, unknown>).lotNumber === "string");

    const ownerHint =
      parsed &&
      (typeof parsed.ownerNameDeclared === "string" ||
        typeof (parsed as Record<string, unknown>).ownerName === "string");

    const datePresent = issueMs !== null;

    const slotOk = (context.uploadedDocuments ?? []).some(
      (d) => String(d.docType) === "certificate_optional" && ["uploaded", "pending_review", "approved"].includes(String(d.status)),
    );

    const brokerOffer = context.brokerFlow === true || context.offerStage === true;

    for (const def of defs) {
      let passed = false;
      let message = "Checked against platform metadata only.";
      let severity: CertificateOfLocationChecklistResult["severity"] = def.severity;

      switch (def.id) {
        case "certificate_document_present":
          passed = docPresent || slotOk;
          message = passed
            ? "A certificate-class record or optional certificate slot is present."
            : "No certificate of location class record detected in structured legal imports.";
          if (!passed) {
            pushUnique(blockingIssues, "Certificate of location appears missing in platform records.");
          }
          break;
        case "document_type_matches_certificate_of_location":
          passed = typeMatches || (docPresent && Boolean(parsed?.certificateType));
          message = passed
            ? "Structured type label matches certificate of location class."
            : "Document type metadata is missing or does not match certificate of location heuristics.";
          if (!passed && docPresent) {
            pushUnique(warnings, "Verify the document type matches a certificate of location.");
          }
          break;
        case "property_identification_present":
          passed = Boolean(parcelHint);
          message = passed ? "Property identification hints are present." : "Cadastre or parcel hints are not present in parsed fields.";
          break;
        case "issue_or_reference_date_present":
          passed = datePresent;
          message = passed ? "Issue or reference date is present." : "Issue date is missing — update may be required once dated document is available.";
          if (!datePresent && docPresent) pushUnique(warnings, "Issue or reference date is missing — manual review recommended.");
          break;
        case "owner_or_property_link_present":
          passed = Boolean(ownerHint);
          message = passed ? "Owner or property linkage hints exist." : "Owner linkage hints are not present in parsed fields.";
          break;
        case "no_critical_validation_failures":
          passed = !hasCriticalFailures;
          message = passed ? "No critical validation failures flagged for the record bundle." : "Critical validation findings are present — additional verification required.";
          if (!passed) {
            pushUnique(blockingIssues, "Validation signals require attention before proceeding.");
          }
          break;
        case "broker_manual_review_ready":
          passed = !brokerOffer;
          message = brokerOffer
            ? "Manual review recommended for broker or offer-stage workflows."
            : "Broker or offer-stage review is not required for this context flag.";
          if (brokerOffer) {
            pushUnique(warnings, "Manual review recommended for broker or offer-stage workflows.");
          }
          break;
        case "change_since_certificate_reviewed":
          passed = context.changedSinceCertificate !== true;
          message =
            context.changedSinceCertificate === true
              ? "Changes since certificate issuance are indicated — manual review recommended."
              : "No explicit change-after-certificate flag is set.";
          if (context.changedSinceCertificate === true) {
            severity = "warning";
          }
          break;
        case "update_may_be_required_if_property_changed":
          passed = context.changedSinceCertificate !== true;
          message =
            context.changedSinceCertificate === true
              ? "Update may be required if property changed — manual review recommended."
              : "No property-change signal tied to certificate staleness.";
          break;
        default:
          passed = true;
      }

      checklistResults.push({
        itemId: def.id,
        passed,
        message,
        severity,
      });
    }

    let readinessLevel: CertificateOfLocationReadinessLevel = "ready_for_broker_review";
    const blockingFailed = checklistResults.some((r) => {
      const d = defs.find((x) => x.id === r.itemId);
      return d?.blocking === true && !r.passed;
    });

    if (!docPresent && !slotOk) readinessLevel = "not_ready";
    else if (blockingFailed || status === "rejected") readinessLevel = "not_ready";
    else if (status === "needs_review" || hasCriticalFailures) readinessLevel = "review_required";
    else if (!typeMatches || !datePresent || context.changedSinceCertificate === true) readinessLevel = "partial";
    else readinessLevel = "ready_for_broker_review";

    let riskLevel: CertificateOfLocationRiskLevel = "low";
    if (status === "rejected" || blockingFailed) riskLevel = "high";
    else if (status === "needs_review" || hasCriticalFailures) riskLevel = "elevated";
    else if (status === "may_be_outdated" || context.changedSinceCertificate === true) riskLevel = "guarded";
    else riskLevel = "low";

    const nextStepsPlaceholder: string[] = [];

    let parsedDataExtracted: CertificateOfLocationParsedData | undefined;
    let timelineSignals = undefined as CertificateOfLocationSummary["timelineSignals"];
    let consistencySignals = undefined as CertificateOfLocationSummary["consistencySignals"];

    if (brokerAiFlags.brokerAiCertificateOfLocationV2) {
      parsedDataExtracted = extractCertificateOfLocationParsedData(parsed as Record<string, unknown> | null);
      timelineSignals = buildCertificateTimelineSignals(parsedDataExtracted, context);
      consistencySignals = validateCertificateConsistency(parsedDataExtracted, context);

      if (timelineSignals.flaggedAsPotentiallyOutdated && riskLevel !== "high") {
        riskLevel = riskLevel === "low" ? "guarded" : riskLevel === "guarded" ? "elevated" : riskLevel;
      }

      for (const m of consistencySignals.mismatches) {
        if (m.includes("cadastre") || m.includes("lot")) {
          pushUnique(blockingIssues, "Structured lot or cadastre metadata mismatch — additional verification required.");
          if (readinessLevel === "partial" || readinessLevel === "ready_for_broker_review") {
            readinessLevel = "review_required";
          }
        } else if (m.includes("address")) {
          pushUnique(warnings, "Address metadata differs between listing and certificate fields — manual review recommended.");
          if (readinessLevel === "ready_for_broker_review") readinessLevel = "partial";
        }
      }

      if (
        parsedDataExtracted &&
        !parsedDataExtracted.issueDate &&
        docPresent &&
        readinessLevel !== "not_ready"
      ) {
        readinessLevel = readinessLevel === "ready_for_broker_review" ? "review_required" : readinessLevel;
        pushUnique(warnings, "Issue date missing from structured certificate fields — manual review recommended.");
      }

      if (timelineSignals.flaggedAsPotentiallyOutdated && context.offerStage === true && readinessLevel !== "not_ready") {
        readinessLevel = "review_required";
      }
    }

    const baseSummary: CertificateOfLocationSummary = {
      listingId,
      status,
      readinessLevel,
      riskLevel,
      checklistResults,
      blockingIssues,
      warnings,
      nextSteps: nextStepsPlaceholder,
      availabilityNotes,
      ...(brokerAiFlags.brokerAiCertificateOfLocationV2 ?
        {
          parsedData: parsedDataExtracted,
          timelineSignals,
          consistencySignals,
        }
      : {}),
    };

    const explainability = brokerAiFlags.brokerAiCertificateOfLocationV2 ? buildCertificateExplainability(baseSummary) : undefined;

    return {
      ...baseSummary,
      ...(explainability ? { explainability } : {}),
    };
  } catch {
    return {
      listingId,
      status: "missing",
      readinessLevel: "not_ready",
      riskLevel: "guarded",
      checklistResults: [],
      blockingIssues: ["evaluation_fallback"],
      warnings: [],
      nextSteps: [],
      availabilityNotes: [...availabilityNotes, "evaluation_used_fallback"],
      ...(brokerAiFlags.brokerAiCertificateOfLocationV2 ?
        {
          explainability: {
            reasons: ["Evaluation could not complete — manual review recommended."],
            contributingSignals: ["eval:fallback"],
          },
        }
      : {}),
    };
  }
}
