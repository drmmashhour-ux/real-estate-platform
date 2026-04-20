import type { CertificateLocationObservationFacts } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-observation-bridge.service";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const certificateLocationPreviewRuleCode = "certificate_location_preview_readiness";

function factsCert(ctx: PolicyContext): CertificateLocationObservationFacts | null {
  const raw = ctx.observation?.facts?.certificateOfLocationV2;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 2) return null;
  return raw as CertificateLocationObservationFacts;
}

/**
 * Preview-only governance — deterministic signals from structured certificate helper (no legal conclusions).
 */
export function evaluateCertificateLocationPreviewReadiness(ctx: PolicyContext): PolicyRuleEvaluation {
  const cert = factsCert(ctx);
  if (!cert) {
    return { ruleCode: certificateLocationPreviewRuleCode, result: "passed" };
  }

  const mismatch = cert.consistencyMismatchCount > 0;
  const severe =
    cert.readinessPenalty01 >= 0.65 ||
    cert.riskLevel === "elevated" ||
    cert.riskLevel === "high";

  if (mismatch) {
    return {
      ruleCode: certificateLocationPreviewRuleCode,
      result: "warning",
      dispositionHint: "ALLOW_DRY_RUN",
      reason:
        "Certificate / listing structured fields show a mismatch signal — preview only; manual verification recommended.",
      metadata: {
        readinessLevel: cert.readinessLevel,
        mismatchCount: cert.consistencyMismatchCount,
      },
    };
  }

  if (severe || cert.timelineFlagged) {
    return {
      ruleCode: certificateLocationPreviewRuleCode,
      result: "warning",
      dispositionHint: "ALLOW_DRY_RUN",
      reason:
        "Certificate readiness or timeline signals warrant caution in preview — not a legal determination.",
      metadata: {
        readinessLevel: cert.readinessLevel,
        timelineFlagged: cert.timelineFlagged,
      },
    };
  }

  return { ruleCode: certificateLocationPreviewRuleCode, result: "passed" };
}
