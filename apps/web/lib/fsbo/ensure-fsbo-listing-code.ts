import type { Prisma } from "@prisma/client";
import { allocateUniqueLSTListingCode } from "@/lib/listing-code";

type Tx = Prisma.TransactionClient;

/**
 * Ensures FSBO row has a public `listingCode` (LST-…). Idempotent; use before publish / webhook activation.
 */
export async function ensureFsboListingListingCode(
  tx: Tx,
  fsboListingId: string
): Promise<string> {
  const row = await tx.fsboListing.findUnique({
    where: { id: fsboListingId },
    select: { listingCode: true },
  });
  if (row?.listingCode?.trim()) {
    return row.listingCode.trim();
  }
  const code = await allocateUniqueLSTListingCode(tx);
  await tx.fsboListing.update({
    where: { id: fsboListingId },
    data: { listingCode: code },
  });
  return code;
}
