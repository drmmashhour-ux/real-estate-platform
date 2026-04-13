import { prisma } from "@/lib/db";
import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { saveHostAgreement } from "@/lib/agreements/platform-agreements";
import { NBHUB_SHORT_TERM_RENTAL_AGREEMENT_HTML } from "@/lib/bnhub/nbhub-short-term-rental-agreement";
import { syncHostAgreementAcceptanceToContracts } from "@/lib/contracts/bnhub-host-contracts";

export async function getHostByUserId(userId: string) {
  return prisma.bnhubHost.findUnique({
    where: { userId },
    include: { listings: true, hostAgreement: true },
  });
}

export async function getApprovedHost(userId: string) {
  const host = await prisma.bnhubHost.findUnique({
    where: { userId },
    include: { listings: true, hostAgreement: true },
  });
  return host?.status === "approved" ? host : null;
}

/** Bump when host-facing BNHUB short-term rental terms change (re-acceptance required). */
const HOST_AGREEMENT_VERSION = "2025-03-22";

export async function getHostAgreement(hostId: string) {
  return prisma.hostAgreement.findUnique({
    where: { hostId },
  });
}

/** True if host has an accepted agreement for the current version. */
export async function hasAcceptedHostAgreement(hostId: string): Promise<boolean> {
  const agreement = await prisma.hostAgreement.findUnique({
    where: { hostId },
  });
  return agreement?.accepted === true && agreement?.version === HOST_AGREEMENT_VERSION;
}

export async function acceptHostAgreement(hostId: string) {
  const acceptedAt = new Date();
  const result = await prisma.hostAgreement.upsert({
    where: { hostId },
    create: {
      hostId,
      accepted: true,
      acceptedAt,
      version: HOST_AGREEMENT_VERSION,
    },
    update: {
      accepted: true,
      acceptedAt,
      version: HOST_AGREEMENT_VERSION,
    },
  });
  // Store agreement content in platform_agreements for contract logic
  const legalDoc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.BNHUB_HOST_AGREEMENT);
  await saveHostAgreement({
    hostId,
    version: HOST_AGREEMENT_VERSION,
    contentHtml: legalDoc?.content ?? NBHUB_SHORT_TERM_RENTAL_AGREEMENT_HTML,
    acceptedAt,
  });
  const hostRow = await prisma.bnhubHost.findUnique({
    where: { id: hostId },
    select: { userId: true },
  });
  if (hostRow) {
    await syncHostAgreementAcceptanceToContracts(hostRow.userId).catch(() => {});
  }
  return result;
}

export { HOST_AGREEMENT_VERSION };

export async function getPendingHosts() {
  return prisma.bnhubHost.findMany({
    where: { status: "pending" },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllHosts() {
  return prisma.bnhubHost.findMany({
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
