import { prisma } from "@/lib/db";

import type {
  ComplianceScoreResponse,
  InsuranceStatusResponse,
  BrokerInsuranceCard,
} from "./insurance.types";
import { logInsurance } from "./insurance-log";
import { evaluateBrokerInsuranceRisk } from "./insurance-risk.engine";
import { triggerInsuranceAlerts } from "./insurance-alert.service";

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

/** True when broker has an in-force FARCIQ policy row marked ACTIVE and meets coverage requirements. */
export async function isBrokerInsuranceValid(brokerId: string): Promise<boolean> {
  try {
    const now = new Date();
    // Minimum coverage threshold (e.g., $1,000,000)
    const MIN_COVERAGE_THRESHOLD = 1000000;

    const row = await prisma.brokerInsurance.findFirst({
      where: {
        brokerId,
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
        coveragePerLoss: { gte: MIN_COVERAGE_THRESHOLD },
      },
      orderBy: { endDate: "desc" },
      select: { id: true, status: true, startDate: true, endDate: true, coveragePerLoss: true },
    });

    const ok = Boolean(row);
    logInsurance("validity_check", { brokerId, ok, coverage: row?.coveragePerLoss });
    return ok;
  } catch (e) {
    logInsurance("validity_check_error", { brokerId, err: e instanceof Error ? e.message : "unknown" });
    return false;
  }
}

/** @deprecated Use isBrokerInsuranceValid */
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

    const MIN_COVERAGE_THRESHOLD = 1000000;
    const effectiveActive =
      policy.status === "ACTIVE" &&
      policy.startDate <= now &&
      policy.endDate >= now &&
      policy.coveragePerLoss >= MIN_COVERAGE_THRESHOLD;

    return {
      hasPolicy: true,
      status: effectiveActive ? "ACTIVE" : (policy.status as InsuranceStatusResponse["status"]),
      policy: mapCard(policy),
      message: effectiveActive
        ? "Policy active for the current term."
        : policy.coveragePerLoss < MIN_COVERAGE_THRESHOLD
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

    if (risk.riskScore >= 70) {
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
