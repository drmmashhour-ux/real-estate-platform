/**
 * Read-only adapter for CRM / web-backed listings → shared platform-normalized shapes (ca_qc).
 */
import type { NormalizedListing } from "@lecipm/platform-core";
import { prisma } from "@/lib/db";

export const WEB_REGION_ADAPTER_CODE = "ca_qc" as const;

function notes(...n: string[]): readonly string[] {
  return n;
}

export function normalizeWebListingRow(raw: unknown): NormalizedListing | null {
  try {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : "";
    if (!id) return null;
    const price = typeof r.price === "number" ? r.price : null;
    return {
      id,
      sourceApp: "web",
      regionCode: "ca_qc",
      listingType:
        typeof r.commissionCategory === "string" ? r.commissionCategory
        : typeof r.listingCode === "string" ? r.listingCode
        : null,
      title: typeof r.title === "string" ? r.title : null,
      status: typeof r.commissionCategory === "string" ? r.commissionCategory : null,
      priceHint: price,
      currency: "CAD",
      complianceState: "unknown",
      legalRiskScoreHint: null,
      trustScoreHint: null,
      fraudFlag: false,
      bookingCountHint: null,
      revenueHint: null,
      payoutPendingHint: null,
      availabilityNotes: notes("web_crm_listing_min_projection"),
    };
  } catch {
    return null;
  }
}

export async function webGetListingById(listingId: string): Promise<{
  listing: NormalizedListing | null;
  availabilityNotes: readonly string[];
}> {
  const id = typeof listingId === "string" ? listingId.trim() : "";
  if (!id) return { listing: null, availabilityNotes: notes("listing_id_missing") };
  try {
    const row = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        price: true,
        title: true,
        listingCode: true,
        commissionCategory: true,
        updatedAt: true,
      },
    });
    if (!row) return { listing: null, availabilityNotes: notes("web_listing_not_found") };
    const listing = normalizeWebListingRow(row);
    return { listing, availabilityNotes: listing ? notes() : notes("normalize_failed") };
  } catch {
    return { listing: null, availabilityNotes: notes("web_listing_read_failed") };
  }
}

export async function webListListingsSummary(limit = 50): Promise<{
  items: NormalizedListing[];
  availabilityNotes: readonly string[];
}> {
  try {
    const rows = await prisma.listing.findMany({
      take: Math.min(500, Math.max(1, limit)),
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        price: true,
        title: true,
        listingCode: true,
        commissionCategory: true,
        updatedAt: true,
      },
    });
    const items: NormalizedListing[] = [];
    for (const row of rows) {
      const n = normalizeWebListingRow(row);
      if (n) items.push(n);
    }
    return { items, availabilityNotes: notes("crm_listing_table_scope") };
  } catch {
    return { items: [], availabilityNotes: notes("web_list_summary_failed") };
  }
}

/** Registry-compatible export — same surface as Syria adapter. */
export const webRegionAdapter = {
  regionCode: WEB_REGION_ADAPTER_CODE,
  getListingById: webGetListingById,
  listListingsSummary: webListListingsSummary,
  normalizeListing: normalizeWebListingRow,
};

export type WebRegionAdapter = typeof webRegionAdapter;
