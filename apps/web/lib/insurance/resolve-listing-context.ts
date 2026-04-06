import { prisma } from "@/lib/db";

/** Best-effort human-readable listing line for partner emails (no secrets). */
export async function resolveInsuranceListingContext(listingId: string): Promise<string | null> {
  const [st, fsbo, crm] = await Promise.all([
    prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { title: true, city: true, listingCode: true },
    }),
    prisma.fsboListing.findUnique({
      where: { id: listingId },
      select: { title: true, city: true, listingCode: true },
    }),
    prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true, listingCode: true },
    }),
  ]);
  if (st) return `BNHub stay: ${st.title} · ${st.city} (${st.listingCode})`;
  if (fsbo) return `Property listing: ${fsbo.title} · ${fsbo.city} (${fsbo.listingCode ?? listingId})`;
  if (crm) return `CRM listing: ${crm.title} (${crm.listingCode})`;
  return null;
}
