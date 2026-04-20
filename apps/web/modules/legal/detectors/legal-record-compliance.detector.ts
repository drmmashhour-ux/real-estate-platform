/**
 * Signals from deterministic legal record import summaries — no raw document payloads.
 */

import { legalHubFlags } from "@/config/feature-flags";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalDetector } from "./legal-detector.types";

function severityFor(
  missing: number,
  inconsistent: number,
  criticalRules: number,
): "info" | "warning" | "critical" {
  if (criticalRules > 0 || inconsistent > 0) return "critical";
  if (missing > 0) return "warning";
  return "info";
}

export const legalRecordComplianceDetector: LegalDetector = {
  id: "legal_record_compliance" as const,
  run: (snapshot) => {
    const signals: LegalIntelligenceSignal[] = [];
    try {
      if (!legalHubFlags.legalAiLogicV1 || !legalHubFlags.legalHubV1) return signals;
      const rows = snapshot.legalImportedRecords ?? [];
      if (rows.length === 0) return signals;

      let totalMissing = 0;
      let totalInconsistent = 0;
      let incompleteDecl = false;
      const fingerprints = new Set<string>();

      for (const r of rows) {
        totalMissing += r.missingFieldCount;
        totalInconsistent += r.inconsistentFieldCount;
        if (r.recordType === "seller_declaration" && (r.missingFieldCount > 0 || r.warningCount > 0)) {
          incompleteDecl = true;
        }
        if (typeof r.parcelIdFingerprint === "string" && r.parcelIdFingerprint.trim()) {
          fingerprints.add(r.parcelIdFingerprint.trim());
        }
      }

      const observedAt = snapshot.builtAt;

      const pushOnce = (
        signalType: LegalIntelligenceSignal["signalType"],
        severity: LegalIntelligenceSignal["severity"],
        explanation: string,
        metadata: Record<string, string | number | boolean | null>,
      ) => {
        signals.push({
          id: `lrc-${snapshot.entityId}-${signalType}`,
          signalType,
          severity,
          entityType: snapshot.entityType,
          entityId: snapshot.entityId,
          actorType: snapshot.actorType || "unknown",
          workflowType: snapshot.workflowType || "legal_records",
          observedAt,
          explanation,
          metadata,
        });
      };

      if (totalMissing > 0) {
        pushOnce(
          "missing_required_fields",
          severityFor(totalMissing, totalInconsistent, 0),
          "Structured legal record submissions are missing required fields per the active schema.",
          {
            recordsInScope: rows.length,
            missingFieldMarkers: totalMissing,
          },
        );
      }

      if (totalInconsistent > 0) {
        pushOnce(
          "inconsistent_legal_data",
          "critical",
          "Cross-field validation flagged inconsistencies in supplied structured legal data.",
          {
            inconsistentMarkers: totalInconsistent,
          },
        );
      }

      if (rows.some((r) => r.warningCount > 2 || r.requiresReviewRuleCount > 1)) {
        pushOnce(
          "suspicious_data_pattern",
          "warning",
          "Multiple advisory markers appeared across structured legal records — operational review may be appropriate.",
          {
            warningMarkers: rows.reduce((a, r) => a + r.warningCount, 0),
          },
        );
      }

      if (incompleteDecl) {
        pushOnce(
          "incomplete_declaration",
          "warning",
          "Seller declaration structured fields appear incomplete relative to required inputs.",
          { incompleteDeclaration: true },
        );
      }

      if (fingerprints.size >= 2) {
        pushOnce(
          "conflicting_records",
          "warning",
          "Multiple ownership-related records reference different parcel identifiers in structured fields.",
          { distinctParcelFingerprints: fingerprints.size },
        );
      }

      return signals;
    } catch {
      return [];
    }
  },
};
