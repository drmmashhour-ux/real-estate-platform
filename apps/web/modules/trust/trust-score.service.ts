import type { LegalIntelligenceSummary } from "@/modules/legal/legal-intelligence.types";
import type { LegalReadinessScore } from "@/modules/legal/legal-readiness.types";
import type { TrustFactor, TrustLevel, TrustScore } from "./trust.types";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export type ComputeTrustScoreParams = {
  legalReadinessScore?: LegalReadinessScore | null;
  legalIntelligenceSummary?: LegalIntelligenceSummary | null;
  /** Document / workflow rejection rate 0–1 when known */
  rejectionRate?: number | null;
  /** Approval rate 0–1 when known */
  approvalRate?: number | null;
  accountAgeDays?: number | null;
  /** 0–1 consistency signal when known */
  activityConsistency01?: number | null;
  /** Phase 4.5 — ratio of document_approved vs document reject/approve outcomes from timeline when measurable */
  timelineDocumentOutcome01?: number | null;
  /** 0–1 gap from structured legal record completeness / consistency (deterministic index). */
  legalRecordComplianceGap01?: number | null;
  /** 0–100 Québec compliance checklist readiness (deterministic) when loaded. */
  quebecComplianceReadinessScore?: number | null;
  /** Phase 8 — 0–100 property legal risk index when supplied (higher = riskier). */
  propertyLegalRiskScore?: number | null;
  verificationFlags?: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
    stripeOnboardingComplete?: boolean;
    brokerLicenseVerified?: boolean;
  };
};

function levelFromScore(score: number): TrustLevel {
  if (score <= 29) return "low";
  if (score <= 59) return "medium";
  if (score <= 79) return "high";
  if (score <= 94) return "verified";
  return "premium";
}

/**
 * Deterministic trust score from observable platform signals — no ML, no throws.
 */
export function computeTrustScore(params: ComputeTrustScoreParams): TrustScore {
  try {
    const factors: string[] = [];
    const pushFactor = (code: TrustFactor, text: string) => {
      factors.push(`${code}:${text}`);
    };

    let score = params.legalReadinessScore != null ? params.legalReadinessScore.score : 52;
    if (params.legalReadinessScore != null) {
      pushFactor("legal_readiness", `Legal readiness index ${params.legalReadinessScore.score}/100 (${params.legalReadinessScore.level}).`);
    } else {
      pushFactor("legal_readiness", "Legal readiness not loaded — neutral baseline applied.");
    }

    const intel = params.legalIntelligenceSummary;
    if (intel) {
      const crit = intel.countsBySeverity?.critical ?? 0;
      const warn = intel.countsBySeverity?.warning ?? 0;
      const penalty = crit * 14 + warn * 5;
      score -= penalty;
      if (crit > 0) {
        pushFactor(
          "intelligence_signals",
          `Compliance intelligence: ${crit} critical, ${warn} warning signal(s) — reduces trust until reviewed.`,
        );
      } else if (warn > 0) {
        pushFactor("intelligence_signals", `Compliance intelligence: ${warn} warning signal(s).`);
      } else {
        pushFactor("intelligence_signals", "No elevated compliance intelligence signals in scope.");
      }
    } else {
      pushFactor("intelligence_signals", "Compliance intelligence summary unavailable — no adjustment.");
    }

    const rr = params.rejectionRate;
    if (typeof rr === "number" && Number.isFinite(rr)) {
      const r = clamp(rr, 0, 1);
      score -= Math.round(r * 22);
      pushFactor("document_approval_rate", `Document/workflow rejection rate ${Math.round(r * 100)}%.`);
    } else {
      pushFactor("document_approval_rate", "Document approval rate not available — no adjustment.");
    }

    const ar = params.approvalRate;
    if (typeof ar === "number" && Number.isFinite(ar)) {
      const a = clamp(ar, 0, 1);
      score += Math.round(a * 12);
      pushFactor("document_approval_rate", `Approval rate ${Math.round(a * 100)}% improves trust.`);
    }

    const age = params.accountAgeDays;
    if (typeof age === "number" && Number.isFinite(age) && age >= 0) {
      let agePts = 0;
      if (age >= 730) agePts = 8;
      else if (age >= 365) agePts = 6;
      else if (age >= 180) agePts = 4;
      else if (age >= 30) agePts = 2;
      score += agePts;
      pushFactor("account_age", `Account age ~${Math.round(age)} days (+${agePts}).`);
    } else {
      pushFactor("account_age", "Account age unknown — no age adjustment.");
    }

    const act = params.activityConsistency01;
    if (typeof act === "number" && Number.isFinite(act)) {
      const a = clamp(act, 0, 1);
      const add = Math.round(a * 8);
      score += add;
      pushFactor("activity_consistency", `Activity consistency index ${Math.round(a * 100)}% (+${add}).`);
    } else {
      pushFactor("activity_consistency", "Activity consistency not measured — no adjustment.");
    }

    const legalGap = params.legalRecordComplianceGap01;
    if (typeof legalGap === "number" && Number.isFinite(legalGap)) {
      const g = clamp(legalGap, 0, 1);
      const boost = Math.round((1 - g) * 6);
      const penalty = Math.round(g * 15);
      score += boost - penalty;
      pushFactor(
        "legal_record_compliance",
        `Structured legal records index: gap ~${Math.round(g * 100)}% (−${penalty} pts), structure alignment ~${Math.round((1 - g) * 100)}% (+${boost} pts).`,
      );
    } else {
      pushFactor("legal_record_compliance", "Legal record compliance index not supplied — no adjustment.");
    }

    const qcs = params.quebecComplianceReadinessScore;
    if (typeof qcs === "number" && Number.isFinite(qcs)) {
      const s = clamp(qcs, 0, 100);
      if (s >= 90) {
        const add = 3;
        score += add;
        pushFactor("quebec_compliance", `Québec compliance readiness index ${s}/100 (strong — +${add}).`);
      } else if (s >= 70) {
        pushFactor("quebec_compliance", `Québec compliance readiness index ${s}/100 (neutral).`);
      } else {
        const pen = Math.min(12, Math.round((70 - s) * 0.25));
        score -= pen;
        pushFactor("quebec_compliance", `Québec compliance readiness index ${s}/100 (incomplete — −${pen}).`);
      }
    } else {
      pushFactor("quebec_compliance", "Québec compliance readiness not supplied — no adjustment.");
    }

    const plr = params.propertyLegalRiskScore;
    if (typeof plr === "number" && Number.isFinite(plr)) {
      const p = clamp(plr, 0, 100);
      const pen = Math.min(16, Math.round(p * 0.12));
      score -= pen;
      pushFactor(
        "property_legal_risk",
        `Property legal risk index ${p}/100 — bounded dampening on trust contribution (−${pen}).`,
      );
    } else {
      pushFactor("property_legal_risk", "Property legal risk index not supplied — no adjustment.");
    }

    const tdoc = params.timelineDocumentOutcome01;
    if (typeof tdoc === "number" && Number.isFinite(tdoc)) {
      const t = clamp(tdoc, 0, 1);
      const delta = Math.round((t - 0.5) * 14);
      score += delta;
      pushFactor(
        "timeline_document_outcomes",
        `Recorded document outcome balance ~${Math.round(t * 100)}% approvals (${delta >= 0 ? "+" : ""}${delta}).`,
      );
    } else {
      pushFactor("timeline_document_outcomes", "Document outcome timeline not available — no adjustment.");
    }

    const vf = params.verificationFlags;
    if (vf) {
      let v = 0;
      if (vf.emailVerified) v += 4;
      if (vf.phoneVerified) v += 5;
      if (vf.stripeOnboardingComplete) v += 3;
      if (vf.brokerLicenseVerified) v += 6;
      score += v;
      pushFactor(
        "verification_status",
        `Verification flags: email ${vf.emailVerified ? "yes" : "no"}, phone ${vf.phoneVerified ? "yes" : "no"}, payouts ${vf.stripeOnboardingComplete ? "ready" : "n/a"}, broker license ${vf.brokerLicenseVerified ? "verified" : "n/a"} (+${v}).`,
      );
    } else {
      pushFactor("verification_status", "Verification flags not provided.");
    }

    if (intel?.countsBySeverity?.critical && intel.countsBySeverity.critical > 0) {
      score = Math.min(score, 89);
    }

    score = clamp(Math.round(score), 0, 100);

    if (intel?.countsBySeverity?.critical && intel.countsBySeverity.critical > 0) {
      score = Math.min(score, 94);
    }

    const readiness = params.legalReadinessScore;
    if (readiness && (readiness.missingCritical > 0 || readiness.level === "not_ready")) {
      score = Math.min(score, 92);
    }

    const level = levelFromScore(score);

    let confidence: TrustScore["confidence"] = "low";
    if (params.legalReadinessScore != null && intel != null) confidence = "high";
    else if (params.legalReadinessScore != null || intel != null) confidence = "medium";

    return {
      score,
      level,
      confidence,
      factors: factors.slice(0, 24),
    };
  } catch {
    return {
      score: 50,
      level: "medium",
      confidence: "low",
      factors: ["trust:evaluation_fallback"],
    };
  }
}
