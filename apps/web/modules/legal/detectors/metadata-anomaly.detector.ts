import { METADATA_LONG_NAME_CHARS } from "../legal-intelligence.constants";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalDetector } from "./legal-detector.types";
import { stableSignalId } from "./legal-detector-utils";

function looksPdfName(name: string): boolean {
  return name.toLowerCase().endsWith(".pdf");
}

export const metadataAnomalyDetector: LegalDetector = {
  id: "metadata_anomaly",
  run(snapshot): LegalIntelligenceSignal[] {
    const out: LegalIntelligenceSignal[] = [];
    const listingId = snapshot.fsboListingId ?? snapshot.entityId;

    for (const d of snapshot.supportingDocuments) {
      if (d.originalFileName.length >= METADATA_LONG_NAME_CHARS) {
        out.push({
          id: stableSignalId(["metadata_anomaly", "long_name", d.id]),
          signalType: "metadata_anomaly",
          severity: "info",
          entityType: snapshot.entityType || "legal_workflow",
          entityId: listingId,
          actorType: snapshot.actorType || "unknown",
          workflowType: snapshot.workflowType || "unknown",
          observedAt: snapshot.builtAt,
          explanation:
            "Operational anomaly: unusually long displayed filename metadata — confirm client rendering and intake tooling.",
          metadata: {
            docId: d.id,
            nameLength: d.originalFileName.length,
          },
        });
      }
      if (looksPdfName(d.originalFileName) && d.mimeType !== "application/pdf") {
        out.push({
          id: stableSignalId(["metadata_anomaly", "mime_mismatch", d.id]),
          signalType: "metadata_anomaly",
          severity: "warning",
          entityType: snapshot.entityType || "legal_workflow",
          entityId: listingId,
          actorType: snapshot.actorType || "unknown",
          workflowType: snapshot.workflowType || "unknown",
          observedAt: snapshot.builtAt,
          explanation:
            "MIME label differs from filename extension hint — validate upload pipeline and scanner behavior.",
          metadata: {
            docId: d.id,
            mimeType: d.mimeType,
          },
        });
      }
    }

    return out;
  },
};
