import { prisma } from "@/lib/db";
import { snapshotBnhubListingForLead } from "@/lib/leads/bnhub-listing-context";
import type { ImmoListingKind } from "./types";

export type { ImmoListingKind };

export type ImmoListingSnapshot = {
  kind: ImmoListingKind;
  listingId: string;
  listingCode: string | null;
  title: string;
  location: string;
};

/**
 * Resolve listing context for ImmoContact (BNHUB stay or CRM sale listing).
 */
export async function resolveImmoListing(params: {
  listingKind: ImmoListingKind;
  listingRef: string;
}): Promise<ImmoListingSnapshot | null> {
  const ref = params.listingRef.trim();
  if (!ref) return null;

  if (params.listingKind === "bnhub") {
    const snap = await snapshotBnhubListingForLead(ref);
    if (!snap) return null;
    const row = await prisma.shortTermListing.findUnique({
      where: { id: snap.listingId },
      select: {
        title: true,
        city: true,
        region: true,
        province: true,
        country: true,
      },
    });
    if (!row) return null;
    const location = [row.city, row.region || row.province, row.country].filter(Boolean).join(", ");
    return {
      kind: "bnhub",
      listingId: snap.listingId,
      listingCode: snap.listingCode,
      title: row.title,
      location: location || "—",
    };
  }

  const crm = await prisma.listing.findUnique({
    where: { id: ref },
    select: { id: true, listingCode: true, title: true },
  });
  if (!crm) return null;
  return {
    kind: "crm",
    listingId: crm.id,
    listingCode: crm.listingCode,
    title: crm.title,
    location: "—",
  };
}

/** Broker to attribute for HOT alerts / pipeline (best-effort). */
export async function resolveImmoIntroducedBrokerId(snapshot: ImmoListingSnapshot): Promise<string | undefined> {
  if (snapshot.kind === "bnhub") {
    const row = await prisma.shortTermListing.findUnique({
      where: { id: snapshot.listingId },
      select: { owner: { select: { id: true, role: true } } },
    });
    if (row?.owner?.role === "BROKER") return row.owner.id;
    return undefined;
  }
  const access = await prisma.brokerListingAccess.findFirst({
    where: { listingId: snapshot.listingId },
    orderBy: { grantedAt: "asc" },
    select: { brokerId: true },
  });
  return access?.brokerId;
}
