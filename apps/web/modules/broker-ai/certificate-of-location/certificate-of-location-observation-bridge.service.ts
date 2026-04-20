/**
 * Read-only observation facts for autonomy preview — never writes.
 */

import { brokerAiFlags } from "@/config/feature-flags";
import { buildCertificateOfLocationContextFromDb } from "./certificate-of-location-context.service";
import { evaluateCertificateOfLocation } from "./certificate-of-location-evaluator.service";

export type CertificateLocationObservationFacts = {
  version: 2;
  readinessLevel: string;
  riskLevel: string;
  status: string;
  readinessPenalty01: number;
  consistencyMismatchCount: number;
  timelineFlagged: boolean;
};

export async function buildCertificateLocationObservationFacts(listingId: string): Promise<CertificateLocationObservationFacts | null> {
  try {
    if (!brokerAiFlags.brokerAiCertificateOfLocationV2) return null;
    const id = listingId.trim();
    if (!id) return null;

    const ctx = await buildCertificateOfLocationContextFromDb({ listingId: id });
    const summary = evaluateCertificateOfLocation(ctx);

    let readinessPenalty01 = 0;
    if (summary.readinessLevel === "not_ready") readinessPenalty01 = 1;
    else if (summary.readinessLevel === "review_required") readinessPenalty01 = 0.65;
    else if (summary.readinessLevel === "partial") readinessPenalty01 = 0.35;

    return {
      version: 2,
      readinessLevel: summary.readinessLevel,
      riskLevel: summary.riskLevel,
      status: summary.status,
      readinessPenalty01,
      consistencyMismatchCount: summary.consistencySignals?.mismatches?.length ?? 0,
      timelineFlagged: summary.timelineSignals?.flaggedAsPotentiallyOutdated ?? false,
    };
  } catch {
    return null;
  }
}
