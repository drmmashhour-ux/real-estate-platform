/**
 * Read-only preview lines for autonomy explainability — never performs writes.
 */

import { brokerAiFlags } from "@/config/feature-flags";
import { buildCertificateOfLocationContextFromDb } from "./certificate-of-location-context.service";
import { evaluateCertificateOfLocation } from "./certificate-of-location-evaluator.service";
import { buildCertificateOfLocationNextSteps } from "./certificate-of-location-guidance.service";
import { getCertificateOfLocationBlockerImpact } from "./certificate-of-location-blocker.service";

export async function buildCertificateOfLocationPreviewLines(listingId: string): Promise<string[]> {
  try {
    if (!brokerAiFlags.brokerAiCertificateOfLocationV1) return [];
    const id = typeof listingId === "string" ? listingId.trim() : "";
    if (!id) return [];

    const ctx = await buildCertificateOfLocationContextFromDb({ listingId: id });
    const summaryBase = evaluateCertificateOfLocation(ctx);
    const steps = buildCertificateOfLocationNextSteps(summaryBase);
    const summary = { ...summaryBase, nextSteps: steps };
    const impact = getCertificateOfLocationBlockerImpact(summary);

    const lines: string[] = [];
    if (summary.status === "missing") {
      lines.push("Certificate of location is missing in structured platform records.");
    } else {
      lines.push(`Certificate of location platform status: ${summary.status.replace(/_/g, " ")} — informational only.`);
    }

    if (impact.affectsBrokerReview || impact.affectsPublish || impact.affectsOfferReadiness) {
      lines.push("Manual review is recommended before relying on listing collateral.");
    }

    if (summary.status === "may_be_outdated") {
      lines.push("Certificate of location may require update — manual review recommended.");
    }

    if (steps[0]) lines.push(steps[0]);
    if (steps[1]) lines.push(steps[1]);

    if (brokerAiFlags.brokerAiCertificateOfLocationV2 && summaryBase.explainability?.reasons?.length) {
      for (const r of summaryBase.explainability.reasons.slice(0, 3)) {
        lines.push(r);
      }
    }

    return [...new Set(lines)].slice(0, 8);
  } catch {
    return [];
  }
}
