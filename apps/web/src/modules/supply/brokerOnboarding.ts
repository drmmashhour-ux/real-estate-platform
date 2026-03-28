import type { BrokerStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export type BrokerOnboardingStage =
  | "not_applicable"
  | "account_created"
  | "pending_verification"
  | "verified"
  | "rejected";

export type BrokerOnboardingSnapshot = {
  userId: string;
  role: PlatformRole;
  brokerStatus: BrokerStatus;
  stage: BrokerOnboardingStage;
  hasOaciqLicenseFields: boolean;
};

/**
 * Supply-side broker readiness for routing and trust surfacing.
 */
export async function getBrokerOnboardingSnapshot(userId: string): Promise<BrokerOnboardingSnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      brokerStatus: true,
      name: true,
      phone: true,
    },
  });
  if (!user) return null;

  const reg = await prisma.brokerTaxRegistration.findUnique({
    where: { userId },
    select: { legalName: true, businessNumberNine: true },
  }).catch(() => null);

  const stage: BrokerOnboardingStage =
    user.role !== "BROKER" && user.role !== "ADMIN"
      ? "not_applicable"
      : user.brokerStatus === "VERIFIED"
        ? "verified"
        : user.brokerStatus === "REJECTED"
          ? "rejected"
          : user.brokerStatus === "PENDING"
            ? "pending_verification"
            : "account_created";

  return {
    userId: user.id,
    role: user.role,
    brokerStatus: user.brokerStatus,
    stage,
    hasOaciqLicenseFields: Boolean(reg?.legalName && reg?.businessNumberNine),
  };
}
