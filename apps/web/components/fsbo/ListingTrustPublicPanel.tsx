"use client";

import Link from "next/link";

type Props = {
  listingId: string;
  trustScore: number | null;
  isOwner: boolean;
};

/**
 * Public FSBO sidebar — trust/readiness snapshot (informational, not a guarantee).
 */
export function ListingTrustPublicPanel({ listingId, trustScore, isOwner }: Props) {
  const score = trustScore ?? 0;
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className="rounded-2xl border border-[#C9A646]/25 bg-[#121212] p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Trust & readiness</p>
      <p className="mt-1 text-xs text-slate-500">Informational — improves with verification and documents.</p>
      <div className="mt-6 flex flex-col items-center">
        <div
          className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-[#C9A646]/40 bg-[#0B0B0B] shadow-[0_0_28px_rgba(201,166,70,0.2)]"
          aria-hidden
        >
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Trust</span>
        </div>
        <span className="mt-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200/95">
          Listing readiness
        </span>
      </div>
      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#C9A646]/90 transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      {isOwner ? (
        <Link
          href={`/dashboard/seller/listings/${encodeURIComponent(listingId)}`}
          className="mt-6 flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#C9A646] px-4 text-sm font-bold text-[#0B0B0B] shadow-[0_0_24px_rgba(201,166,70,0.35)] transition hover:bg-[#E8C547]"
        >
          Fix now
        </Link>
      ) : (
        <p className="mt-4 text-center text-xs text-slate-500">Owners can improve trust from the seller hub.</p>
      )}
    </div>
  );
}
