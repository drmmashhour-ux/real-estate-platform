"use client";

import Link from "next/link";
import { ShareMyStayRoot, ShareMyStayWorkspace } from "@/components/bnhub/share-my-stay";

export function BookingShareMyStayBundle({
  bookingId,
  checkOutIso,
  bookingPageId,
  isGuest,
  isHost,
}: {
  bookingId: string;
  checkOutIso: string;
  bookingPageId: string;
  isGuest: boolean;
  isHost: boolean;
}) {
  return (
    <ShareMyStayRoot bookingId={bookingId} checkOutIso={checkOutIso}>
      <div className="mt-8">
        <ShareMyStayWorkspace />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {isGuest ? (
          <Link
            href={`/bnhub/booking/${bookingPageId}/report-issue`}
            className="rounded-xl border border-rose-600/60 px-4 py-2.5 text-sm font-medium text-rose-200 hover:bg-rose-900/30"
          >
            Report an issue
          </Link>
        ) : null}
        <Link
          href={`/bnhub/booking/${bookingPageId}/dispute`}
          className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Open dispute
        </Link>
        <Link
          href="/bnhub/trips"
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500"
        >
          My trips
        </Link>
        {isGuest ? (
          <Link
            href={`/guest/payments/${bookingPageId}`}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500"
          >
            Payment details
          </Link>
        ) : null}
        <Link
          href="/bnhub/stays"
          className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Browse more stays
        </Link>
        {isHost ? (
          <Link
            href="/bnhub/host/dashboard"
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500"
          >
            Host dashboard
          </Link>
        ) : null}
      </div>
    </ShareMyStayRoot>
  );
}
