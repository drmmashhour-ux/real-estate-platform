import type { Prisma } from "@prisma/client";
import { ListingStatus, ListingVerificationStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { emitPlatformAutonomyEvent } from "@/lib/autonomy/emit-platform-event";
import { allocateUniqueLSTListingCode } from "@/lib/listing-code";
import { splitCsvLine } from "@/lib/growth/csv-import";

const HEADERS = ["title", "city", "address", "night_price_cad", "beds", "baths", "max_guests", "country", "region"];

export type BulkStayRow = {
  title: string;
  city: string;
  address: string;
  nightPriceCents: number;
  beds: number;
  /** Prisma `baths` is Float */
  baths: number;
  maxGuests: number;
  country: string;
  region: string | null;
};

export type ParsedBulkStayCsv = {
  rows: BulkStayRow[];
  errors: string[];
};

function parseMoneyCad(raw: string): number | null {
  const t = raw.trim().replace(/[$,\s]/g, "");
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n <= 0 || n > 50_000) return null;
  return Math.round(n * 100);
}

function parseIntSafe(raw: string, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Admin CSV for draft BNHUB stays. Header row optional.
 *
 * Columns: title, city, address, night_price_cad, beds, baths, max_guests, country, region
 */
export function parseBulkStayCsv(text: string): ParsedBulkStayCsv {
  const errors: string[] = [];
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: ["Empty file"] };
  }

  let start = 0;
  const first = lines[0]!.toLowerCase();
  if (HEADERS.some((h) => first.includes(h))) {
    start = 1;
  }

  const rows: BulkStayRow[] = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]!;
    const parts = splitCsvLine(line);
    if (parts.length < 4) {
      errors.push(`Line ${i + 1}: need title, city, address, night_price_cad`);
      continue;
    }

    const title = parts[0]?.trim() ?? "";
    const city = parts[1]?.trim() ?? "";
    const address = parts[2]?.trim() ?? "";
    const nightPriceCents = parseMoneyCad(parts[3] ?? "");
    const beds = parseIntSafe(parts[4] ?? "1", 1, 1, 20);
    const bathsRaw = Number.parseFloat((parts[5] ?? "1").trim());
    const baths = Number.isFinite(bathsRaw) ? Math.min(20, Math.max(1, bathsRaw)) : 1;
    const maxGuests = parseIntSafe(parts[6] ?? String(Math.max(2, beds * 2)), Math.max(2, beds * 2), 1, 32);
    const country = (parts[7]?.trim() || "CA").slice(0, 2).toUpperCase() || "CA";
    const region = parts[8]?.trim() ? parts[8]!.trim().slice(0, 64) : null;

    if (!title || !city || !address) {
      errors.push(`Line ${i + 1}: title, city, and address are required`);
      continue;
    }
    if (nightPriceCents == null) {
      errors.push(`Line ${i + 1}: invalid night_price_cad`);
      continue;
    }

    rows.push({
      title: title.slice(0, 200),
      city: city.slice(0, 120),
      address: address.slice(0, 500),
      nightPriceCents,
      beds,
      baths,
      maxGuests,
      country,
      region,
    });
  }

  return { rows, errors };
}

const MAX_ROWS = 60;

/**
 * Creates DRAFT stays for a host. Does not publish or verify — ops complete in host console.
 */
export async function bulkCreateDraftStaysFromCsv(
  hostUserId: string,
  csvText: string,
): Promise<{ created: number; listingIds: string[]; parseErrors: string[] }> {
  const host = await prisma.user.findUnique({ where: { id: hostUserId }, select: { id: true } });
  if (!host) {
    throw new Error("Host user not found");
  }

  const { rows, errors } = parseBulkStayCsv(csvText);
  if (rows.length === 0) {
    return { created: 0, listingIds: [], parseErrors: errors.length ? errors : ["No valid rows"] };
  }
  if (rows.length > MAX_ROWS) {
    throw new Error(`Too many rows (max ${MAX_ROWS})`);
  }

  const listingIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const r of rows) {
      const listingCode = await allocateUniqueLSTListingCode(tx);
      const desc =
        "Draft — created via admin bulk import. Replace with host-written description before publish.";
      const row = await tx.shortTermListing.create({
        data: {
          listingCode,
          title: r.title,
          description: desc,
          address: r.address,
          city: r.city,
          region: r.region,
          country: r.country,
          listingStatus: ListingStatus.DRAFT,
          listingVerificationStatus: ListingVerificationStatus.DRAFT,
          verificationStatus: VerificationStatus.PENDING,
          nightPriceCents: r.nightPriceCents,
          currency: "CAD",
          beds: r.beds,
          baths: r.baths,
          maxGuests: r.maxGuests,
          ownerId: hostUserId,
          photos: [] as unknown as Prisma.InputJsonValue,
          amenities: [] as unknown as Prisma.InputJsonValue,
          permissionSourceNote: "admin_bulk_stay_csv",
          missingApprovedImages: true,
          imagesApproved: false,
        },
      });
      listingIds.push(row.id);
    }
  });

  for (const id of listingIds) {
    void emitPlatformAutonomyEvent({
      eventType: "LISTING_CREATED",
      entityType: "short_term_listing",
      entityId: id,
      userId: hostUserId,
      payload: { listingId: id, source: "admin_bulk_csv" },
    });
  }

  return { created: listingIds.length, listingIds, parseErrors: errors };
}
