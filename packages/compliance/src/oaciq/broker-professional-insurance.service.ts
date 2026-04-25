import { prisma } from "@/lib/db";
import { lecipmOaciqFlags } from "@/config/feature-flags";
import { logInsuranceTagged } from "@/lib/server/launch-logger";
import { MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD } from "@/modules/compliance/insurance/insurance.types";

export class BrokerProfessionalInsuranceError extends Error {
  constructor(message = "Active broker professional liability insurance (FARCIQ) is required.") {
    super(message);
    this.name = "BrokerProfessionalInsuranceError";
  }
}

export function brokerProfessionalInsuranceEnforced(): boolean {
  return lecipmOaciqFlags.brokerProfessionalInsuranceV1;
}

/**
 * Marks in-term rows as EXPIRED when past `endDate`. Auditable via `[insurance] expired`.
 */
export async function refreshBrokerInsuranceStatuses(brokerId: string): Promise<void> {
  const now = new Date();
  const res = await prisma.brokerInsurance.updateMany({
    where: {
      brokerId,
      status: "ACTIVE",
      endDate: { lt: now },
    },
    data: { status: "EXPIRED" },
  });
  if (res.count > 0) {
    logInsuranceTagged.warn("expired", { brokerId, count: res.count });
  }
}

export type BrokerInsuranceValidation = {
  isValid: boolean;
  daysRemaining: number;
  nearExpiry: boolean;
};

/**
 * FARCIQ / professional liability gate: ACTIVE, in date range, not suspended, meets minimum per-loss limit.
 */
export async function validateBrokerInsurance(brokerId: string): Promise<BrokerInsuranceValidation> {
  await refreshBrokerInsuranceStatuses(brokerId);
  const now = new Date();
  const row = await prisma.brokerInsurance.findFirst({
    where: {
      brokerId,
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
      coveragePerLoss: { gte: MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD },
    },
    orderBy: { endDate: "desc" },
  });

  if (!row) {
    return { isValid: false, daysRemaining: 0, nearExpiry: false };
  }

  const ms = row.endDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(ms / 86_400_000));
  const nearExpiry = daysRemaining > 0 && daysRemaining < 30;
  return { isValid: true, daysRemaining, nearExpiry };
}

export async function assertBrokerProfessionalInsuranceActiveOrThrow(
  brokerId: string | null | undefined,
  context: string,
): Promise<void> {
  if (!brokerProfessionalInsuranceEnforced() || !brokerId) return;

  const v = await validateBrokerInsurance(brokerId);
  if (!v.isValid) {
    logInsuranceTagged.warn("blocked", { brokerId, context });
    throw new BrokerProfessionalInsuranceError();
  }
  logInsuranceTagged.info("validated", { brokerId, context, daysRemaining: v.daysRemaining });
}
