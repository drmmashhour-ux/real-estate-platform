"use client";

import { useState } from "react";

type Props = {
  listingId: string;
  expiresAt: string | null;
  archived: boolean;
  expired: boolean;
  renewable: boolean;
  ownerType: "SELLER" | "BROKER";
};

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SellerListingExpiryCard({
  listingId,
  expiresAt,
  archived,
  expired,
  renewable,
  ownerType,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusLabel = expired ? "Expired" : archived ? "Archived" : "Active window";

  async function handleRenew() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(listingId)}/renew`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Unable to renew listing.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Unable to renew listing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Listing expiry
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">{statusLabel}</h2>
          <p className="mt-2 text-sm text-slate-300">
            Expiry date: <span className="text-white">{formatDate(expiresAt)}</span>
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {ownerType === "BROKER"
              ? "Broker-managed listings follow the signed broker mandate term."
              : "Owner-direct listings run for 3 months and can be renewed before expiry."}
          </p>
          {expired || archived ? (
            <p className="mt-2 text-sm text-amber-300">
              This listing is no longer public until it is renewed or reactivated.
            </p>
          ) : null}
        </div>

        {renewable ? (
          <button
            type="button"
            onClick={handleRenew}
            disabled={loading}
            className="rounded-full border border-premium-gold/40 px-5 py-2.5 text-sm text-premium-gold transition hover:bg-premium-gold/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Renewing..." : "Renew 3 months"}
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
