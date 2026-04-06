"use client";

import { useEffect, useState } from "react";

type Insight = {
  yourNightCents: number;
  peerAvgNightCents: number | null;
  peerListingCount: number;
  currency: string;
  city: string;
  guestBullets: string[];
  disclaimer: string;
};

function formatMoney(cents: number, currency: string) {
  const n = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.length === 3 ? currency : "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n.toFixed(0)}`;
  }
}

export function BnhubMarketPriceInsightCard({ listingId }: { listingId: string }) {
  const [data, setData] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetch(`/api/bnhub/listings/${encodeURIComponent(listingId)}/market-insight`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        if (!j?.guestBullets) {
          setData(null);
          setErr(null);
          return;
        }
        setData({
          yourNightCents: j.yourNightCents,
          peerAvgNightCents: j.peerAvgNightCents,
          peerListingCount: j.peerListingCount,
          currency: j.currency ?? "USD",
          city: j.city,
          guestBullets: j.guestBullets,
          disclaimer: j.disclaimer,
        });
        setErr(null);
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setErr(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
        Loading price context…
      </div>
    );
  }
  if (err || !data) return null;

  return (
    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-950/15 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Market rate on BNHub</p>
      <p className="mt-1 text-sm text-slate-200">
        This listing:{" "}
        <span className="font-semibold text-white">{formatMoney(data.yourNightCents, data.currency)}/night</span>
        {data.peerAvgNightCents != null && data.peerListingCount >= 2 ? (
          <>
            {" "}
            · City sample avg ~{formatMoney(data.peerAvgNightCents, data.currency)} ({data.peerListingCount} published
            in {data.city})
          </>
        ) : (
          <> · Limited peer data in {data.city} on BNHub</>
        )}
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
        {data.guestBullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-snug text-slate-600">{data.disclaimer}</p>
    </div>
  );
}
