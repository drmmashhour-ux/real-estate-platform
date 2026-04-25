"use client";

import { useCallback, useMemo, useState } from "react";

export type PricingAiListingOption = { id: string; title: string; city: string };

type SuggestApiResponse = {
  error?: string;
  listingId?: string;
  currency?: string;
  currentPriceCents?: number;
  suggestedPriceCents?: number;
  priceDeltaCents?: number;
  priceDeltaPct?: number;
  reasoning?: string[];
  pricingMode?: string;
  wouldAutoApplyWithinSafeLimits?: boolean;
  safetyClamped?: boolean;
  rawSuggestedPriceCents?: number;
  transparency?: { suggestionOnly?: boolean; maxChangePctEachWay?: number };
};

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function PricingAiSuggestPanel(props: {
  listings: PricingAiListingOption[];
  initialListingId: string;
  themeAccent: string;
  themeText: string;
}) {
  const { listings, initialListingId, themeAccent, themeText } = props;
  const [listingId, setListingId] = useState(initialListingId || (listings[0]?.id ?? ""));
  const [checkIn, setCheckIn] = useState("");
  const [eventBoost, setEventBoost] = useState("0");
  const [loading, setLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SuggestApiResponse | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  const selected = useMemo(() => listings.find((l) => l.id === listingId), [listings, listingId]);

  const loadSuggestion = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    setApplyMessage(null);
    try {
      const u = new URL("/api/host/pricing/suggest", window.location.origin);
      u.searchParams.set("listingId", listingId);
      if (checkIn.trim()) u.searchParams.set("checkIn", checkIn.trim());
      const eb = Number(eventBoost);
      if (Number.isFinite(eb) && eb > 0) u.searchParams.set("eventBoost", String(Math.min(1, Math.max(0, eb))));

      const res = await fetch(u.toString(), { credentials: "include" });
      const json = (await res.json()) as SuggestApiResponse;
      if (!res.ok) {
        setData(null);
        setError(json.error ?? `Request failed (${res.status})`);
        return;
      }
      setData(json);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [listingId, checkIn, eventBoost]);

  const applySuggestion = useCallback(async () => {
    if (!listingId || !data?.suggestedPriceCents) return;
    setApplyLoading(true);
    setApplyMessage(null);
    try {
      const res = await fetch(`/api/host/listings/${listingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nightPriceCents: data.suggestedPriceCents,
          pricingAiApplied: true,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setApplyMessage(json.error ?? `Save failed (${res.status})`);
        return;
      }
      setApplyMessage("Saved. Your listing nightly rate was updated to the suggested value.");
    } catch (e) {
      setApplyMessage(e instanceof Error ? e.message : "Network error");
    } finally {
      setApplyLoading(false);
    }
  }, [listingId, data?.suggestedPriceCents]);

  if (listings.length === 0) {
    return (
      <p className="text-sm opacity-80" style={{ color: themeText }}>
        Add a BNHub listing from the host dashboard to see dynamic pricing suggestions.
      </p>
    );
  }

  const currency = data?.currency ?? "USD";
  const primaryReason =
    (data?.reasoning ?? []).find((line, i) => i > 0 && line && !line.startsWith("Current base nightly rate")) ?? "";

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/5 p-4 dark:bg-white/5">
      <h2 className="text-base font-semibold" style={{ color: themeText }}>
        Dynamic pricing (transparent AI)
      </h2>
      <p className="text-xs opacity-80" style={{ color: themeText }}>
        Suggestions stay within ±{data?.transparency?.maxChangePctEachWay ?? 30}% of your current base rate. Nothing
        applies automatically from this page unless you choose &quot;Use suggested price&quot;.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs">
          <span className="opacity-80" style={{ color: themeText }}>
            Listing
          </span>
          <select
            className="rounded-lg border border-white/15 bg-transparent px-2 py-2 text-sm"
            style={{ color: themeText }}
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
          >
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} — {l.city}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[160px] flex-col gap-1 text-xs">
          <span className="opacity-80" style={{ color: themeText }}>
            Target check-in (optional)
          </span>
          <input
            type="date"
            className="rounded-lg border border-white/15 bg-transparent px-2 py-2 text-sm"
            style={{ color: themeText }}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </label>
        <label className="flex min-w-[140px] flex-col gap-1 text-xs">
          <span className="opacity-80" style={{ color: themeText }}>
            Event demand (0–1, optional)
          </span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className="rounded-lg border border-white/15 bg-transparent px-2 py-2 text-sm"
            style={{ color: themeText }}
            value={eventBoost}
            onChange={(e) => setEventBoost(e.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || !listingId}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: themeAccent }}
          onClick={() => void loadSuggestion()}
        >
          {loading ? "Calculating…" : "Get suggestion"}
        </button>
        {data?.suggestedPriceCents != null && (
          <button
            type="button"
            disabled={applyLoading}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{ color: themeText }}
            onClick={() => void applySuggestion()}
          >
            {applyLoading ? "Saving…" : "Use suggested price"}
          </button>
        )}
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {applyMessage ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{applyMessage}</p>
      ) : null}

      {data?.suggestedPriceCents != null && data.currentPriceCents != null ? (
        <div className="space-y-2 text-sm" style={{ color: themeText }}>
          <p>
            <span className="font-medium">Suggested price:</span>{" "}
            {formatMoney(data.suggestedPriceCents, currency)}
          </p>
          <p className="opacity-90">
            <span className="font-medium">Current base:</span> {formatMoney(data.currentPriceCents, currency)} (
            {data.priceDeltaPct != null ? `${(data.priceDeltaPct * 100).toFixed(1)}%` : "—"} vs base
            {data.safetyClamped ? "; adjusted to safety band" : ""})
          </p>
          {primaryReason ? (
            <p className="opacity-90">
              <span className="font-medium">Reason:</span> {primaryReason}
            </p>
          ) : null}
          {selected ? (
            <p className="text-xs opacity-70">
              Listing: {selected.title} — {selected.city}. Mode: {data.pricingMode ?? "manual"}
              {data.wouldAutoApplyWithinSafeLimits ? " (auto mode would consider in-band updates)" : ""}.
            </p>
          ) : null}
          <details className="text-xs opacity-80">
            <summary className="cursor-pointer">Full reasoning</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {(data.reasoning ?? []).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            {data.safetyClamped && data.rawSuggestedPriceCents != null ? (
              <p className="mt-2">
                Unclamped model output would have been {formatMoney(data.rawSuggestedPriceCents, currency)}; the band
                keeps changes gradual.
              </p>
            ) : null}
          </details>
        </div>
      ) : null}
    </div>
  );
}
