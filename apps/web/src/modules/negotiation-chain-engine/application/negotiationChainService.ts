import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { NegotiationVersionStatus } from "@prisma/client";
import type {
  CreateCounterOfferParams,
  CreateOfferParams,
  NegotiationVersionWithDetails,
} from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";

const versionInclude = {
  terms: true,
  clauses: true,
} as const;

export async function createOffer(params: CreateOfferParams) {
  const { propertyId, caseId, createdBy, role, terms, clauses } = params;
  return prisma.$transaction(async (tx) => {
    const chain = await tx.negotiationChain.create({
      data: {
        propertyId,
        caseId: caseId ?? null,
        status: "active",
      },
    });
    const version = await tx.negotiationVersion.create({
      data: {
        chainId: chain.id,
        versionNumber: 1,
        parentVersionId: null,
        createdBy,
        role,
        status: "pending",
        isFinal: false,
      },
    });
    await tx.negotiationTerm.create({
      data: {
        versionId: version.id,
        priceCents: terms.priceCents,
        depositCents: terms.depositCents,
        financingTerms: terms.financingTerms as object,
        commissionTerms: terms.commissionTerms as object,
        deadlines: terms.deadlines as object,
      },
    });
    if (clauses.length) {
      await tx.negotiationClause.createMany({
        data: clauses.map((c) => ({
          versionId: version.id,
          clauseType: c.clauseType,
          text: c.text,
          addedInVersion: c.addedInVersion,
          removed: c.removed ?? false,
        })),
      });
    }
    return tx.negotiationVersion.findUniqueOrThrow({
      where: { id: version.id },
      include: versionInclude,
    });
  });
}

export async function createCounterOffer(params: CreateCounterOfferParams) {
  const { chainId, createdBy, role, terms, clauses } = params;
  return prisma.$transaction(async (tx) => {
    const chain = await tx.negotiationChain.findUnique({
      where: { id: chainId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });
    if (!chain) throw new Error("Chain not found");
    if (chain.status !== "active") throw new Error("Chain is not open for new versions");
    const last = chain.versions[0];
    if (!last) throw new Error("Chain has no versions");
    const nextNum = last.versionNumber + 1;

    const version = await tx.negotiationVersion.create({
      data: {
        chainId,
        versionNumber: nextNum,
        parentVersionId: last.id,
        createdBy,
        role,
        status: "pending",
        isFinal: false,
      },
    });
    await tx.negotiationTerm.create({
      data: {
        versionId: version.id,
        priceCents: terms.priceCents,
        depositCents: terms.depositCents,
        financingTerms: terms.financingTerms as object,
        commissionTerms: terms.commissionTerms as object,
        deadlines: terms.deadlines as object,
      },
    });
    if (clauses.length) {
      await tx.negotiationClause.createMany({
        data: clauses.map((c) => ({
          versionId: version.id,
          clauseType: c.clauseType,
          text: c.text,
          addedInVersion: c.addedInVersion,
          removed: c.removed ?? false,
        })),
      });
    }
    return tx.negotiationVersion.findUniqueOrThrow({
      where: { id: version.id },
      include: versionInclude,
    });
  });
}

async function clearFinalFlags(chainId: string, tx: Prisma.TransactionClient) {
  await tx.negotiationVersion.updateMany({
    where: { chainId },
    data: { isFinal: false },
  });
}

export async function acceptVersion(chainId: string, versionId: string) {
  return prisma.$transaction(async (tx) => {
    const chain = await tx.negotiationChain.findUnique({ where: { id: chainId } });
    if (!chain) throw new Error("Chain not found");
    const v = await tx.negotiationVersion.findFirst({
      where: { id: versionId, chainId },
    });
    if (!v) throw new Error("Version not found");
    if (v.status !== "pending") throw new Error("Only pending versions can be accepted");

    await clearFinalFlags(chainId, tx);

    await tx.negotiationVersion.updateMany({
      where: { chainId, status: "pending" as NegotiationVersionStatus, id: { not: versionId } },
      data: { status: "rejected" },
    });

    await tx.negotiationVersion.update({
      where: { id: versionId },
      data: { status: "accepted", isFinal: true },
    });

    await tx.negotiationChain.update({
      where: { id: chainId },
      data: { status: "accepted" },
    });

    return tx.negotiationVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: versionInclude,
    });
  });
}

export async function rejectVersion(chainId: string, versionId: string) {
  return prisma.$transaction(async (tx) => {
    const v = await tx.negotiationVersion.findFirst({
      where: { id: versionId, chainId },
    });
    if (!v) throw new Error("Version not found");
    if (v.status !== "pending") throw new Error("Only pending versions can be rejected");

    await tx.negotiationVersion.update({
      where: { id: versionId },
      data: { status: "rejected", isFinal: false },
    });

    const pending = await tx.negotiationVersion.count({
      where: { chainId, status: "pending" },
    });
    if (pending === 0) {
      const accepted = await tx.negotiationVersion.count({
        where: { chainId, status: "accepted" },
      });
      if (accepted === 0) {
        await tx.negotiationChain.update({
          where: { id: chainId },
          data: { status: "rejected" },
        });
      }
    }

    return tx.negotiationVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: versionInclude,
    });
  });
}

/**
 * Active truth: latest pending if any; otherwise latest accepted.
 * Returns null if chain empty or all rejected without acceptance.
 */
export async function getCurrentActiveVersion(chainId: string): Promise<NegotiationVersionWithDetails | null> {
  const pending = await prisma.negotiationVersion.findFirst({
    where: { chainId, status: "pending" },
    orderBy: { versionNumber: "desc" },
    include: versionInclude,
  });
  if (pending) return pending;

  const accepted = await prisma.negotiationVersion.findFirst({
    where: { chainId, status: "accepted" },
    orderBy: { versionNumber: "desc" },
    include: versionInclude,
  });
  return accepted;
}

/**
 * Case-scoped chain first, then listing-level (caseId null). Single resolution path for LECIPM.
 */
export async function resolveNegotiationChainForListingCase(propertyId: string, caseId: string | null) {
  if (caseId) {
    const scoped = await prisma.negotiationChain.findFirst({
      where: { propertyId, caseId },
      orderBy: { updatedAt: "desc" },
    });
    if (scoped) return scoped;
  }
  return prisma.negotiationChain.findFirst({
    where: { propertyId, caseId: null },
    orderBy: { updatedAt: "desc" },
  });
}

/** Resolve active version for a listing + optional case (most recent chain). */
export async function getCurrentActiveVersionForListing(args: {
  propertyId: string;
  caseId?: string | null;
}): Promise<(NegotiationVersionWithDetails & { chainId: string }) | null> {
  const chain = await resolveNegotiationChainForListingCase(args.propertyId, args.caseId ?? null);
  if (!chain) return null;
  const v = await getCurrentActiveVersion(chain.id);
  if (!v) return null;
  return { ...v, chainId: chain.id };
}

export async function getNegotiationHistory(chainId: string): Promise<NegotiationVersionWithDetails[]> {
  return prisma.negotiationVersion.findMany({
    where: { chainId },
    orderBy: { versionNumber: "asc" },
    include: versionInclude,
  });
}

/**
 * Verify `chainId` is scoped to `propertyId`. Keeps chain lookups out of API route files.
 */
export async function getNegotiationChainForListing(chainId: string, propertyId: string) {
  return prisma.negotiationChain.findFirst({
    where: { id: chainId, propertyId },
    select: { id: true },
  });
}
