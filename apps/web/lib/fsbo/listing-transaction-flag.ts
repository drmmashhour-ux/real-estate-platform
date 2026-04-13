import { prisma } from "@/lib/db";

export type ListingTransactionFlag = {
  key: "offer_received" | "offer_accepted" | "sold";
  label: string;
  tone: "amber" | "emerald" | "slate";
};

function mapDealStatusToFlag(status: string): ListingTransactionFlag | null {
  switch (status) {
    case "offer_submitted":
    case "inspection":
    case "financing":
    case "closing_scheduled":
      return {
        key: "offer_received",
        label: "Offer received",
        tone: "amber",
      };
    case "accepted":
      return {
        key: "offer_accepted",
        label: "Offer accepted (CPP)",
        tone: "emerald",
      };
    case "closed":
      return {
        key: "sold",
        label: "Sold — congratulations",
        tone: "slate",
      };
    default:
      return null;
  }
}

export async function getListingTransactionFlag(
  listingId: string,
  listingStatus?: string | null
): Promise<ListingTransactionFlag | null> {
  if (listingStatus === "SOLD") {
    return { key: "sold", label: "Sold — congratulations", tone: "slate" };
  }

  const deal = await prisma.deal.findFirst({
    where: {
      listingId,
      status: { notIn: ["initiated", "cancelled"] },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: { status: true },
  });

  return mapDealStatusToFlag(deal?.status ?? "");
}

export async function getListingTransactionFlagsForListings(
  listings: Array<{ id: string; status?: string | null }>
): Promise<Map<string, ListingTransactionFlag>> {
  const flags = new Map<string, ListingTransactionFlag>();

  for (const listing of listings) {
    if (listing.status === "SOLD") {
      flags.set(listing.id, { key: "sold", label: "Sold — congratulations", tone: "slate" });
    }
  }

  const listingIds = listings
    .map((listing) => listing.id)
    .filter((id) => !flags.has(id));

  if (listingIds.length === 0) return flags;

  const deals = await prisma.deal.findMany({
    where: {
      listingId: { in: listingIds },
      status: { notIn: ["initiated", "cancelled"] },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      listingId: true,
      status: true,
    },
  });

  for (const deal of deals) {
    if (!deal.listingId || flags.has(deal.listingId)) continue;
    const flag = mapDealStatusToFlag(deal.status);
    if (flag) flags.set(deal.listingId, flag);
  }

  return flags;
}
