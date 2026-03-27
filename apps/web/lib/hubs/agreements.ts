/**
 * Legal agreement system – require agreement per hub/type before professional actions.
 */

import { prisma } from "@/lib/db";

export const LEGAL_AGREEMENT_TYPES = {
  HOSTING_TERMS: "hosting_terms",
  BROKER_TERMS: "broker_terms",
  DEVELOPER_TERMS: "developer_terms",
  PLATFORM_TERMS: "platform_terms",
} as const;

export type LegalAgreementType = (typeof LEGAL_AGREEMENT_TYPES)[keyof typeof LEGAL_AGREEMENT_TYPES];

/** Check if user has accepted agreement for hub/type */
export async function hasAcceptedLegalAgreement(
  userId: string,
  hub: string,
  type: LegalAgreementType | string
): Promise<boolean> {
  const r = await prisma.legalAgreement.findUnique({
    where: {
      userId_hub_type: { userId, hub, type },
    },
  });
  return !!r;
}

/** Record acceptance (idempotent) */
export async function acceptLegalAgreement(
  userId: string,
  hub: string,
  type: LegalAgreementType | string
): Promise<void> {
  await prisma.legalAgreement.upsert({
    where: {
      userId_hub_type: { userId, hub, type },
    },
    create: { userId, hub, type },
    update: { acceptedAt: new Date() },
  });
}

/** Get required agreement type for hub (for onboarding) */
export function getRequiredAgreementType(hub: string): LegalAgreementType | null {
  const h = hub.toLowerCase();
  if (h === "bnhub") return "hosting_terms";
  if (h === "realestate" || h === "broker") return "broker_terms";
  if (h === "projects") return "developer_terms";
  return "platform_terms";
}
