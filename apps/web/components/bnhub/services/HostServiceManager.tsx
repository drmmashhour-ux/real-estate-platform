"use client";

import { useCallback, useEffect, useState } from "react";

type CatalogSvc = {
  id: string;
  serviceCode: string;
  name: string;
  category: string;
  isActive: boolean;
};

type OfferRow = {
  id: string;
  isEnabled: boolean;
  pricingType: string;
  priceCents: number;
  currency: string;
  isIncluded: boolean;
  requiresApproval: boolean;
  notes: string | null;
  adminDisabled: boolean;
};

type Merged = { service: CatalogSvc; offer: OfferRow | null };

const PRICING_TYPES = ["FREE", "FIXED", "PER_DAY", "PER_GUEST", "PER_BOOKING"] as const;

export function HostServiceManager({ listingId }: { listingId: string }) {
  const [merged, setMerged] = useState<Merged[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/bnhub/host/listings/${listingId}/hospitality-services`);
      const j = (await r.json()) as { merged?: Merged[]; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed to load");
      setMerged(j.merged ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setMerged(null);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveRow(serviceId: string, payload: Record<string, unknown>) {
    setError("");
    const r = await fetch(`/api/bnhub/host/listings/${listingId}/hospitality-services`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId, ...payload }),
    });
    const j = (await r.json()) as { error?: string };
    if (!r.ok) throw new Error(j.error ?? "Save failed");
    await load();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading services…</p>;
  if (error && !merged) return <p className="text-sm text-red-400">{error}</p>;
  if (!merged?.length) return <p className="text-sm text-slate-500">No catalog services.</p>;

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <ul className="space-y-6">
        {merged.map(({ service, offer }) => (
          <HostServiceRow key={service.id} service={service} offer={offer} onSave={saveRow} />
        ))}
      </ul>
    </div>
  );
}

function HostServiceRow({
  service,
  offer,
  onSave,
}: {
  service: CatalogSvc;
  offer: OfferRow | null;
  onSave: (serviceId: string, body: Record<string, unknown>) => Promise<void>;
}) {
  const [isEnabled, setIsEnabled] = useState(offer?.isEnabled ?? false);
  const [pricingType, setPricingType] = useState(offer?.pricingType ?? "FIXED");
  const [priceDollars, setPriceDollars] = useState(((offer?.priceCents ?? 0) / 100).toFixed(2));
  const [isIncluded, setIsIncluded] = useState(offer?.isIncluded ?? false);
  const [requiresApproval, setRequiresApproval] = useState(offer?.requiresApproval ?? false);
  const [notes, setNotes] = useState(offer?.notes ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsEnabled(offer?.isEnabled ?? false);
    setPricingType(offer?.pricingType ?? "FIXED");
    setPriceDollars(((offer?.priceCents ?? 0) / 100).toFixed(2));
    setIsIncluded(offer?.isIncluded ?? false);
    setRequiresApproval(offer?.requiresApproval ?? false);
    setNotes(offer?.notes ?? "");
  }, [offer]);

  if (!service.isActive) {
    return (
      <li className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 opacity-60">
        <p className="font-medium text-slate-400">{service.name}</p>
        <p className="text-xs text-slate-600">Disabled platform-wide by admin.</p>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-200">{service.name}</p>
          <p className="text-xs text-slate-500">
            {service.category.replace(/_/g, " ")} · {service.serviceCode}
          </p>
          {offer?.adminDisabled ? (
            <p className="mt-2 text-xs font-medium text-amber-400">
              Admin has restricted this add-on on your listing. Contact support to appeal.
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={isEnabled}
            disabled={offer?.adminDisabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
          />
          Offer to guests
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={isIncluded} onChange={(e) => setIsIncluded(e.target.checked)} />
          Included / complimentary
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={requiresApproval}
            onChange={(e) => setRequiresApproval(e.target.checked)}
          />
          Requires your approval
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Pricing type
          <select
            value={pricingType}
            onChange={(e) => setPricingType(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-200"
          >
            {PRICING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Price (major units, e.g. USD)
          <input
            type="number"
            min={0}
            step={0.01}
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-200"
          />
        </label>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-sm text-slate-300">
        Guest-facing notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-200"
        />
      </label>
      <button
        type="button"
        disabled={busy || offer?.adminDisabled}
        onClick={async () => {
          setBusy(true);
          try {
            const cents = Math.round((parseFloat(priceDollars) || 0) * 100);
            await onSave(service.id, {
              isEnabled,
              pricingType,
              priceCents: cents,
              isIncluded,
              requiresApproval,
              notes: notes.trim() || null,
            });
          } finally {
            setBusy(false);
          }
        }}
        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </li>
  );
}
