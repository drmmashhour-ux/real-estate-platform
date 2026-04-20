import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { prisma } from "@/lib/db";
import { ListingEditClient } from "./listing-edit-client";

export const dynamic = "force-dynamic";

export default async function ListingEditPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const ok = await canAccessCrmListingCompliance(userId, id);
  if (!ok) notFound();

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      listingCode: true,
      title: true,
      price: true,
      listingType: true,
      isCoOwnership: true,
      crmMarketplaceLive: true,
    },
  });
  if (!listing) notFound();

  const prefix = `/${locale}/${country}`;
  const listingsIndexHref = `${prefix}/dashboard/listings`;
  const detailHref = `${prefix}/dashboard/listings/${encodeURIComponent(id)}`;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ListingEditClient
        listing={listing}
        listingsIndexHref={listingsIndexHref}
        detailHref={detailHref}
      />
    </main>
  );
}
