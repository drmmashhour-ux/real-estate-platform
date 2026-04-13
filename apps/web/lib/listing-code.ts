import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateListingCode } from "@/lib/codes/generate-code";
import { normalizeAnyPublicListingCode } from "./listing-code-public";

export {
  LEC_LISTING_CODE_REGEX,
  normalizeListingCode,
  normalizeLSTListingCode,
  normalizeAnyPublicListingCode,
  parseListingCodeFromSearchQuery,
} from "./listing-code-public";

export type ResolvedShortTermListing = {
  id: string;
  listingCode: string;
};

type Tx = Prisma.TransactionClient;

/**
 * Allocate a unique `LST-XXXXXX` across ShortTermListing, CRM Listing, and FSBO listings.
 * Uses atomic sequences (`LST-000001`, …). Codes are never reused after assignment.
 */
export async function allocateUniqueLSTListingCode(tx: Tx): Promise<string> {
  return generateListingCode(tx);
}

/** @deprecated Prefer `allocateUniqueLSTListingCode` — kept for import compatibility. */
export const allocateNextListingCode = allocateUniqueLSTListingCode;

/** Resolve BNHUB listing by internal UUID or by public listing code (LEC or LST). */
export async function resolveShortTermListingRef(
  ref: string | null | undefined
): Promise<ResolvedShortTermListing | null> {
  if (ref == null || !String(ref).trim()) return null;
  const trimmed = String(ref).trim();
  const code = normalizeAnyPublicListingCode(trimmed);
  if (code) {
    const row = await prisma.shortTermListing.findFirst({
      where: { listingCode: { equals: code, mode: "insensitive" } },
      select: { id: true, listingCode: true },
    });
    return row ? { id: row.id, listingCode: row.listingCode } : null;
  }
  const row = await prisma.shortTermListing.findUnique({
    where: { id: trimmed },
    select: { id: true, listingCode: true },
  });
  return row ? { id: row.id, listingCode: row.listingCode } : null;
}
