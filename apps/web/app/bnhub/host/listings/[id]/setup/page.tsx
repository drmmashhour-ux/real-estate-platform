import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getListingById } from "@/lib/bnhub/listings";
import { ListingSetupWizard } from "./ListingSetupWizard";

export const dynamic = "force-dynamic";

export default async function ListingSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: listingId } = await params;
  const userId = await getGuestId();
  if (!userId) notFound();
  const listing = await getListingById(listingId);
  if (!listing || listing.ownerId !== userId) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href={`/bnhub/host/listings/${listingId}/edit`}
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            ← Back to edit listing
          </Link>
          <h1 className="mt-4 text-xl font-semibold">Listing setup</h1>
          <p className="mt-1 text-slate-400">
            Follow the steps to meet publishing requirements: property, photos, details, seller declaration, contracts,
            then publish.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <ListingSetupWizard listingId={listingId} listingTitle={listing.title} />
      </section>
    </main>
  );
}
