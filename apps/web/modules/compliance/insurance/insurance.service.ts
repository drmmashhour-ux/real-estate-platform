import { prisma } from "@/lib/db";

import type {
  ComplianceScoreResponse,
  InsuranceStatusResponse,
  BrokerInsuranceCard,
} from "./insurance.types";
import { logInsurance } from "./insurance-log";
import { evaluateBrokerInsuranceRisk } from "./insurance-risk.engine";

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

/** True when broker has an in-force FARCIQ policy row marked ACTIVE (listing badge). */
export async function isBrokerInsuranceActive(brokerId: string): Promise<boolean> {
  try {
    const now = new Date();
    const row = await prisma.brokerInsurance.findFirst({
      where: {
        brokerId,
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { endDate: "desc" },
      select: { id: true },
    });
    const ok = Boolean(row);
    logInsurance("active_check", { brokerId, ok });
    return ok;
  } catch (e) {
    logInsurance("active_check_error", { brokerId, err: e instanceof Error ? e.message : "unknown" });
    return false;
  }
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

    const effectiveActive =
      policy.status === "ACTIVE" && policy.startDate <= now && policy.endDate >= now;

    return {
      hasPolicy: true,
      status: effectiveActive ? "ACTIVE" : (policy.status as InsuranceStatusResponse["status"]),
      policy: mapCard(policy),
      message: effectiveActive
        ? "Policy active for the current term."
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
