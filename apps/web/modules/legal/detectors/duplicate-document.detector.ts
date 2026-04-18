import {
  DUPLICATE_DOCUMENT_MIN_COUNT,
  DUPLICATE_DOCUMENT_WINDOW_MS,
} from "../legal-intelligence.constants";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalDetector } from "./legal-detector.types";
import { normalizeFileKey, stableSignalId } from "./legal-detector-utils";

function inWindow(iso: string, windowEndMs: number): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return t <= windowEndMs && t >= windowEndMs - DUPLICATE_DOCUMENT_WINDOW_MS;
}

export const duplicateDocumentDetector: LegalDetector = {
  id: "duplicate_document",
  run(snapshot): LegalIntelligenceSignal[] {
    const out: LegalIntelligenceSignal[] = [];
    const builtMs = Date.parse(snapshot.builtAt);
    if (Number.isNaN(builtMs)) return out;
    const listingId = snapshot.fsboListingId ?? snapshot.entityId;
    const groups = new Map<string, number>();
    for (const d of snapshot.supportingDocuments) {
      if (!inWindow(d.createdAt, builtMs)) continue;
      const key = `${normalizeFileKey(d.originalFileName)}::${d.mimeType}`;
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    for (const [key, cnt] of groups.entries()) {
      if (cnt < DUPLICATE_DOCUMENT_MIN_COUNT) continue;
      const observedAt = snapshot.builtAt;
      out.push({
        id: stableSignalId(["duplicate_document", listingId, key]),
        signalType: "duplicate_document",
        severity: cnt >= DUPLICATE_DOCUMENT_MIN_COUNT + 2 ? "critical" : "warning",
        entityType: snapshot.entityType || "legal_workflow",
        entityId: listingId,
        actorType: snapshot.actorType || "unknown",
        workflowType: snapshot.workflowType || "unknown",
        observedAt,
        explanation:
          "Operational pattern: multiple uploads recorded with the same displayed file label and MIME type within the configured window — review sequencing, not proof of misconduct.",
        metadata: {
          groupKeySuffix: key.slice(0, 120),
          uploadCount: cnt,
          windowHours: Math.round(DUPLICATE_DOCUMENT_WINDOW_MS / 3600000),
          listingScoped: true,
        },
      });
    }
    return out;
  },
};
