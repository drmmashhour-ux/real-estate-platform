import { getListingsDB, monolithPrisma, prisma } from "@/lib/db";

export type ConversionBackupData =
  | {
      source: "marketplace";
      listingId: string;
      price: number;
    }
  | {
      source: "bnhub";
      shortTermListingId: string;
      nightPriceCents: number;
    };

/**
 * Append-only pre-change snapshot (caller supplies shape).
 */
export async function saveConversionBackup(listingId: string, data: ConversionBackupData): Promise<void> {
  await prisma.conversionBackup.create({
    data: {
      listingId,
      data: data as unknown as object,
    },
  });
}

/**
 * Revert last **marketplace** price or BNHub nightly from latest backup (ops / emergency).
 */
export async function restoreListingFromLatestBackup(
  listingId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.conversionBackup.findFirst({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });
  if (!row?.data) {
    return { ok: false, error: "No backup" };
  }
  const data = row.data as unknown as ConversionBackupData;
  try {
    if (data.source === "marketplace") {
      await getListingsDB().listing.update({
        where: { id: data.listingId },
        data: { price: data.price },
      });
      return { ok: true };
    }
    if (data.source === "bnhub") {
      await monolithPrisma.shortTermListing.update({
        where: { id: data.shortTermListingId },
        data: { nightPriceCents: data.nightPriceCents },
      });
      return { ok: true };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "restore failed" };
  }
  return { ok: false, error: "Unknown backup shape" };
}
