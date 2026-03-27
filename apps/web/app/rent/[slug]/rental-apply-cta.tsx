"use client";

import Link from "next/link";

export function RentalApplyCta({ listingId }: { listingId: string }) {
  const href = `/rent/apply?listingId=${encodeURIComponent(listingId)}`;
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href={href}
        className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#0B0B0B]"
        style={{ background: "#C9A646" }}
      >
        Apply to rent
      </Link>
      <Link href="/rent" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5">
        Back to listings
      </Link>
    </div>
  );
}
