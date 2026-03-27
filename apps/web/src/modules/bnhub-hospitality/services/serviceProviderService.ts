import type { BnhubProviderType, BnhubProviderVerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function createProviderProfile(args: {
  providerType: BnhubProviderType;
  providerUserId?: string | null;
  displayName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}) {
  return prisma.bnhubServiceProviderProfile.create({
    data: {
      providerType: args.providerType,
      providerUserId: args.providerUserId ?? undefined,
      displayName: args.displayName,
      contactEmail: args.contactEmail ?? undefined,
      contactPhone: args.contactPhone ?? undefined,
      verificationStatus: "UNVERIFIED",
    },
  });
}

export async function updateProviderProfile(
  id: string,
  patch: Partial<{ displayName: string; contactEmail: string | null; contactPhone: string | null; isActive: boolean }>
) {
  return prisma.bnhubServiceProviderProfile.update({ where: { id }, data: patch });
}

export async function verifyProviderProfile(id: string, status: BnhubProviderVerificationStatus) {
  return prisma.bnhubServiceProviderProfile.update({
    where: { id },
    data: { verificationStatus: status },
  });
}

export async function listProvidersByCategory(_category: string) {
  return prisma.bnhubServiceProviderProfile.findMany({
    where: { isActive: true, verificationStatus: "VERIFIED" },
    take: 50,
  });
}

/** Placeholder for partner matching — returns empty until integrations ship. */
export async function matchProviderForRequest(_requestSummary: string) {
  return [] as const;
}
