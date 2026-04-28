import { prisma } from "@/lib/db";
import { pickListingTitle } from "@/lib/listing-localized";
import { money } from "@/lib/format";

/** First paint / API list — id, title, price, location only (no status, no images). */
export type LiteListingListItem = {
  id: string;
  title: string;
  location: string;
  price: string;
};

/** Minimal shape for Ultra-Lite (includes status for legacy / offline rows). */
export type LiteListingRow = {
  id: string;
  title: string;
  location: string;
  price: string;
  status: string;
};

export type LiteBookingRow = {
  id: string;
  title: string;
  price: string;
  status: string;
};

const STAY_BROWSE_WHERE = {
  status: "PUBLISHED" as const,
  fraudFlag: false,
  category: "stay" as const,
  type: "RENT" as const,
  sybnbReview: "APPROVED" as const,
};

const STAY_BROWSE_SELECT = {
  id: true,
  titleAr: true,
  titleEn: true,
  city: true,
  state: true,
  governorate: true,
  price: true,
  currency: true,
  pricePerNight: true,
  status: true,
} as const;

type StayBrowseRow = {
  id: string;
  titleAr: string | null;
  titleEn: string | null;
  city: string | null;
  state: string | null;
  governorate: string | null;
  price: { toString(): string };
  currency: string;
  pricePerNight: unknown;
  status: string;
};

function mapStayRowToListItem(r: StayBrowseRow, locale: string): LiteListingListItem {
  const title = pickListingTitle({ titleAr: r.titleAr ?? "", titleEn: r.titleEn }, locale);
  const loc = [r.city, r.state ?? r.governorate ?? ""].filter(Boolean).join(" · ") || "-";
  const nightly = r.pricePerNight != null ? r.pricePerNight : null;
  const nightLabel = locale.startsWith("ar") ? "ليلة" : "night";
  const priceLabel =
    nightly != null ? `${money(nightly.toString(), r.currency)} / ${nightLabel}` : money(r.price.toString(), r.currency);
  return {
    id: r.id,
    title,
    location: loc,
    price: priceLabel,
  };
}

function mapStayRowToLiteRow(r: StayBrowseRow, locale: string): LiteListingRow {
  const base = mapStayRowToListItem(r, locale);
  return { ...base, status: String(r.status) };
}

export type StayListingsPageResult = {
  items: LiteListingListItem[];
  hasMore: boolean;
  nextPage: number | null;
};

async function fetchStayBrowseRowsRaw(page: number, limit: number): Promise<{ rows: StayBrowseRow[]; hasMore: boolean }> {
  const take = Math.min(Math.max(limit, 1), 50);
  const clampedPage = Math.max(1, Math.floor(page));
  const skip = (clampedPage - 1) * take;

  const rows = await prisma.syriaProperty.findMany({
    where: STAY_BROWSE_WHERE,
    orderBy: { updatedAt: "desc" },
    skip,
    take: take + 1,
    select: STAY_BROWSE_SELECT,
  });

  const hasMore = rows.length > take;
  const slice = hasMore ? rows.slice(0, take) : rows;
  return { rows: slice as StayBrowseRow[], hasMore };
}

/**
 * Paginated stay browse — small payloads, `take = limit + 1` detects hasMore.
 */
export async function fetchStayListingsPaged(
  locale: string,
  page: number,
  limit: number,
): Promise<StayListingsPageResult> {
  const clampedPage = Math.max(1, Math.floor(page));
  const { rows, hasMore } = await fetchStayBrowseRowsRaw(clampedPage, limit);
  return {
    items: rows.map((r) => mapStayRowToListItem(r, locale)),
    hasMore,
    nextPage: hasMore ? clampedPage + 1 : null,
  };
}

/** One query — used by legacy ultra-lite SSR path needing status on each row. */
export async function fetchLiteListingRows(locale: string, take = 48): Promise<LiteListingRow[]> {
  const { rows } = await fetchStayBrowseRowsRaw(1, take);
  return rows.map((r) => mapStayRowToLiteRow(r, locale));
}

/** Recent SYBNB bookings for signed-in guest or host. */
export async function fetchLiteBookingRows(locale: string, userId: string, take = 40): Promise<LiteBookingRow[]> {
  const rows = await prisma.sybnbBooking.findMany({
    where: {
      OR: [{ guestId: userId }, { hostId: userId }],
    },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      status: true,
      totalAmount: true,
      currency: true,
      listing: {
        select: {
          titleAr: true,
          titleEn: true,
        },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: pickListingTitle({ titleAr: r.listing.titleAr, titleEn: r.listing.titleEn }, locale),
    price: money(String(r.totalAmount), r.currency),
    status: String(r.status),
  }));
}
