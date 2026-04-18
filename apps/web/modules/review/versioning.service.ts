import type { DealDocumentVersionSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getNextVersionNumber(dealDocumentId: string): Promise<number> {
  const agg = await prisma.dealDocumentVersion.aggregate({
    where: { dealDocumentId },
    _max: { versionNumber: true },
  });
  return (agg._max.versionNumber ?? 0) + 1;
}

export async function recordDocumentVersion(input: {
  dealDocumentId: string;
  source: DealDocumentVersionSource;
  changesSummary: Record<string, unknown>;
  createdById: string | null;
  /** Optional structured draft snapshot at version time (specimen / broker review — not operative execution). */
  snapshot?: Record<string, unknown> | null;
}): Promise<{ id: string; versionNumber: number }> {
  const versionNumber = await getNextVersionNumber(input.dealDocumentId);
  const row = await prisma.dealDocumentVersion.create({
    data: {
      dealDocumentId: input.dealDocumentId,
      versionNumber,
      source: input.source,
      changesSummary: input.changesSummary as Prisma.InputJsonValue,
      snapshot: input.snapshot === undefined ? undefined : (input.snapshot as Prisma.InputJsonValue),
      createdById: input.createdById,
    },
  });
  return { id: row.id, versionNumber: row.versionNumber };
}

export async function listDocumentVersions(dealDocumentId: string) {
  return prisma.dealDocumentVersion.findMany({
    where: { dealDocumentId },
    orderBy: { versionNumber: "desc" },
  });
}
