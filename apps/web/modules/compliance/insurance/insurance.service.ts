import { prisma } from "@/lib/db";

import type {
  ComplianceScoreResponse,
  InsuranceStatusResponse,
  BrokerInsuranceCard,
  PublicBrokerCoverageResponse,
} from "./insurance.types";
import { INSURANCE_RISK_ALERT_THRESHOLD, MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD } from "./insurance.types";
import { logInsurance } from "./insurance-log";
import { evaluateBrokerInsuranceRisk } from "./insurance-risk.engine";
import { triggerInsuranceAlerts } from "./insurance-alert.service";
import { validateBrokerInsurance } from "@/lib/compliance/oaciq/broker-professional-insurance.service";

function mapCard(row: {
  id: string;
  policyNumber: string | null;
  provider: string;
  coveragePerLoss: number;
  coveragePerYear: number;
  startDate: Date;
  endDate: Date;
  status: string;
  deductibleLevel: number;
}): BrokerInsuranceCard {
  return {
    id: row.id,
    policyNumber: row.policyNumber,
    provider: row.provider,
    coveragePerLoss: row.coveragePerLoss,
    coveragePerYear: row.coveragePerYear,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    status: row.status,
    deductibleLevel: row.deductibleLevel,
  };
}

/** Prisma fragment — user has at least one in-term ACTIVE policy meeting minimum liability (SUSPENDED excluded via status). */
export function prismaUserHasValidBrokerInsurance(now: Date = new Date()) {
  return {
    brokerInsurances: {
      some: {
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
        coveragePerLoss: { gte: MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD },
      },
    },
  };
}

function policyMeetsValidityGate(policy: {
  status: string;
  startDate: Date;
  endDate: Date;
  coveragePerLoss: number;
}, now: Date): boolean {
  if (policy.status === "SUSPENDED") return false;
  return (
    policy.status === "ACTIVE" &&
    policy.startDate <= now &&
    policy.endDate >= now &&
    policy.coveragePerLoss >= MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD
  );
}

/** True when broker has in-force FARCIQ coverage: ACTIVE, in date range, not suspended, meets minimum liability. */
export async function isBrokerInsuranceValid(brokerId: string): Promise<boolean> {
  try {
    const v = await validateBrokerInsurance(brokerId);
    logInsurance("audit_validity_check", { brokerId, ok: v.isValid, daysRemaining: v.daysRemaining });
    return v.isValid;
  } catch (e) {
    logInsurance("validity_check_error", { brokerId, err: e instanceof Error ? e.message : "unknown" });
    return false;
  }
}

/** @deprecated Use isBrokerInsuranceValid — thin alias for backward compatibility. */
export async function isBrokerInsuranceActive(brokerId: string): Promise<boolean> {
  return isBrokerInsuranceValid(brokerId);
}

export async function getBrokerInsuranceStatus(brokerId: string): Promise<InsuranceStatusResponse> {
  try {
    const now = new Date();
    const policy = await prisma.brokerInsurance.findFirst({
      where: { brokerId },
      orderBy: { endDate: "desc" },
    });

    if (!policy) {
      return {
        hasPolicy: false,
        status: "NONE",
        policy: null,
        message: "No FARCIQ policy on file — contact compliance to register coverage.",
      };
    }

    const effectiveActive = policyMeetsValidityGate(policy, now);

    return {
      hasPolicy: true,
      status: effectiveActive ? "ACTIVE" : (policy.status as InsuranceStatusResponse["status"]),
      policy: mapCard(policy),
      message: effectiveActive
        ? "Policy active for the current term."
        : policy.status === "SUSPENDED"
          ? "Policy suspended — contact compliance."
          : policy.coveragePerLoss < MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD
            ? `Policy active but coverage ($${policy.coveragePerLoss}) is below required minimum.`
            : policy.endDate < now
              ? "Policy term ended — renew to restore insured status."
              : `Status: ${policy.status}`,
    };
  } catch (e) {
    logInsurance("status_error", { brokerId, err: e instanceof Error ? e.message : "unknown" });
    return {
      hasPolicy: false,
      status: "NONE",
      policy: null,
      message: "Unable to load insurance status.",
    };
  }
}

export async function getBrokerCoverageDetail(brokerId: string): Promise<BrokerInsuranceCard | null> {
  try {
    const row = await prisma.brokerInsurance.findFirst({
      where: { brokerId },
      orderBy: { endDate: "desc" },
    });
    return row ? mapCard(row) : null;
  } catch (e) {
    logInsurance("coverage_error", { brokerId, err: e instanceof Error ? e.message : "unknown" });
    return null;
  }
}

/** Safe payload for GET /api/insurance/coverage — omits policy number and provider details. */
export async function getPublicBrokerCoverageSummary(brokerId: string): Promise<PublicBrokerCoverageResponse | null> {
  const card = await getBrokerCoverageDetail(brokerId);
  if (!card) return null;
  const now = new Date();
  const expiry = new Date(card.endDate);
  const msToExpiry = expiry.getTime() - now.getTime();
  const thirtyDays = 30 * 86400000;
  return {
    liabilityAmount: card.coveragePerLoss,
    coverageType: "PROFESSIONAL_LIABILITY",
    expiryDate: card.endDate,
    status: card.status,
    nearExpiry: msToExpiry > 0 && msToExpiry <= thirtyDays,
  };
}

export async function getComplianceScoreForBroker(brokerId: string): Promise<ComplianceScoreResponse> {
  try {
    const risk = await evaluateBrokerInsuranceRisk({ brokerId });
    const [highEvents, latest] = await Promise.all([
      prisma.brokerComplianceEvent.count({
        where: {
          brokerId,
          severity: { in: ["HIGH", "MEDIUM"] },
          createdAt: { gte: new Date(Date.now() - 365 * 86400000) },
        },
      }),
      prisma.brokerComplianceEvent.findFirst({
        where: { brokerId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const penalty = Math.min(40, risk.riskScore * 0.35 + highEvents * 5);
    const score = Math.max(0, Math.round(100 - penalty));

    if (risk.riskScore >= INSURANCE_RISK_ALERT_THRESHOLD) {
      await triggerInsuranceAlerts(brokerId, "RISK", { score: risk.riskScore, severity: risk.severity });
    }

    let label = "Strong";
    if (score < 55) label = "Needs attention";
    else if (score < 75) label = "Fair";

    return {
      score,
      max: 100,
      label,
      openRisks: risk.flags.length + highEvents,
      lastEventAt: latest?.createdAt.toISOString() ?? null,
    };
  } catch (e) {
    logInsurance("compliance_score_error", { brokerId, err: e instanceof Error ? e.message : "unknown" });
    return {
      score: 70,
      max: 100,
      label: "Unavailable",
      openRisks: 0,
      lastEventAt: null,
    };
  }
}
