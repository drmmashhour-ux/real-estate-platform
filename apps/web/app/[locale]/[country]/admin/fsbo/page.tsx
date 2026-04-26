import Link from "next/link";
import { redirect } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { AdminFsboClient } from "./admin-fsbo-client";
import { getListingTransactionFlagsForListings } from "@/lib/fsbo/listing-transaction-flag";

export const dynamic = "force-dynamic";

export default async function AdminFsboPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/fsbo");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/");

  const listings = await prisma.fsboListing.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      priceCents: true,
      status: true,
      moderationStatus: true,
      ownerId: true,
      rejectReason: true,
      sellerDeclarationCompletedAt: true,
      riskScore: true,
      trustScore: true,
      _count: { select: { leads: true } },
    },
  });
  const transactionFlags = await getListingTransactionFlagsForListings(
    listings.map((listing) => ({ id: listing.id, status: listing.status }))
  );
  const listingsWithFlags = listings.map((listing) => ({
    ...listing,
    transactionFlag: transactionFlags.get(listing.id) ?? null,
  }));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">FSBO case files</h1>
        <p className="mt-1 text-sm text-slate-400">
          Review seller compliance records, moderation state, and packet-backed case files for sell-by-owner listings.
        </p>
        <AdminFsboClient listings={listingsWithFlags} />
      </div>
    </main>
  );
}
