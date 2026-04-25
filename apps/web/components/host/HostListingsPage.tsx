import Link from "next/link";
import type { HostListingManageRow } from "@/lib/host/listings-data";
import { HostListingsGridClient } from "./HostListingsGridClient";

const GOLD = "#D4AF37";

/**
 * Host listings management: grid, search, status, edit links, add listing.
 */
export function HostListingsPage({
  listings,
  newestListingId,
}: {
  listings: HostListingManageRow[];
  newestListingId?: string;
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Listings</h1>
          <p className="mt-1 text-sm text-zinc-500">Photos, pricing, and availability. Pause or go live any time.</p>
        </div>
        <Link
          href={
            listings.length > 0
              ? `/host/listings/new?from=${encodeURIComponent(newestListingId ?? listings[0]!.id)}`
              : "/host/listings/new"
          }
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-black"
          style={{ backgroundColor: GOLD }}
        >
          Add listing
        </Link>
      </div>

      <HostListingsGridClient listings={listings} newestListingId={newestListingId} />
    </div>
  );
}
