import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { HostListingsGridClient } from "@/components/host/HostListingsGridClient";
import { getHostListings } from "@/lib/host";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

export default async function HostListingsManagePage() {
  const hostId = await getGuestId();
  if (!hostId) return null;

  const listings = await getHostListings(hostId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Listings</h1>
          <p className="mt-1 text-sm text-zinc-500">Photos, pricing, and availability for your stays.</p>
        </div>
        <Link
          href={
            listings.length > 0
              ? `/host/listings/new?from=${encodeURIComponent(listings[0]!.id)}`
              : "/host/listings/new"
          }
          className="inline-flex rounded-xl px-5 py-3 text-sm font-semibold text-black"
          style={{ backgroundColor: GOLD }}
        >
          Add listing
        </Link>
      </div>

      <HostListingsGridClient listings={listings} newestListingId={listings[0]?.id} />
    </div>
  );
}
