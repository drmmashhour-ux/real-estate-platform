import { prisma } from "@repo/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getAccessibleListingsForUser } from "@/lib/listings/get-accessible-listings-for-user";
import { BrokerContentStudioClient } from "./content-studio-client";
import { getBrokerPhoneDisplay, getContactEmail } from "@/lib/config/contact";

export const dynamic = "force-dynamic";

export default async function BrokerContentStudioPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = user?.role === "ADMIN";
  const listings = await getAccessibleListingsForUser(userId, isAdmin);
  const listingCodes = listings.map((listing) => listing.listingCode).filter(Boolean);
  const fsboMatches = listingCodes.length
    ? await prisma.fsboListing.findMany({
        where: {
          listingCode: { in: listingCodes },
        },
        select: {
          listingCode: true,
          city: true,
          bedrooms: true,
          bathrooms: true,
          propertyType: true,
        },
      })
    : [];
  const fsboByCode = new Map(fsboMatches.map((entry) => [entry.listingCode ?? "", entry]));

  return (
    <BrokerContentStudioClient
      brokerContact={{
        phone: getBrokerPhoneDisplay(),
        email: getContactEmail(),
      }}
      listings={listings.map((listing) => ({
        id: listing.id,
        listingCode: listing.listingCode,
        title: listing.title,
        price: listing.price,
        city: fsboByCode.get(listing.listingCode)?.city ?? null,
        bedrooms: fsboByCode.get(listing.listingCode)?.bedrooms ?? null,
        bathrooms: fsboByCode.get(listing.listingCode)?.bathrooms ?? null,
        propertyType: fsboByCode.get(listing.listingCode)?.propertyType ?? null,
      }))}
    />
  );
}
