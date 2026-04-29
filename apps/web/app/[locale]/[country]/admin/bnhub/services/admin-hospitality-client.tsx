"use client";

import { useState } from "react";
import type { BnhubServiceAdminRow } from "@/types/bnhub-service-admin-client";

export function AdminHospitalityClient({ initialServices }: { initialServices: BnhubServiceAdminRow[] }) {
  const [services, setServices] = useState(initialServices);
  const [listingServiceId, setListingServiceId] = useState("");
  const [restrict, setRestrict] = useState(true);
  const [msg, setMsg] = useState("");

  async function patchCatalog(s: BnhubServiceAdminRow, patch: Partial<BnhubServiceAdminRow>) {
    setMsg("");
    const r = await fetch("/api/admin/bnhub/hospitality/catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, ...patch }),
    });
    const j = (await r.json()) as { service?: BnhubServiceAdminRow; error?: string };
    if (!r.ok) {
      setMsg(j.error ?? "Failed");
      return;
    }
    if (j.service) {
      setServices((prev) => prev.map((x) => (x.id === j.service!.id ? j.service! : x)));
    }
  }

  async function patchListingOffer() {
    setMsg("");
    const r = await fetch("/api/admin/bnhub/hospitality/listing-offer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingServiceId: listingServiceId.trim(), adminDisabled: restrict }),
    });
    const j = (await r.json()) as { error?: string };
    if (!r.ok) setMsg(j.error ?? "Failed");
    else setMsg("Listing offer updated.");
  }

  return (
    <div className="space-y-8">
      {msg ? <p className="text-sm text-zinc-400">{msg}</p> : null}
      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {services.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-medium text-zinc-200">{s.name}</p>
              <p className="text-xs text-zinc-500">
                {s.serviceCode} · {s.category}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-zinc-400">
                <input
                  type="checkbox"
                  checked={s.isActive}
                  onChange={() => void patchCatalog(s, { isActive: !s.isActive })}
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-zinc-400">
                <input
                  type="checkbox"
                  checked={s.isPremiumTier}
                  onChange={() => void patchCatalog(s, { isPremiumTier: !s.isPremiumTier })}
                />
                Premium
              </label>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-zinc-800 p-4">
        <h2 className="text-sm font-semibold text-zinc-300">Restrict listing offer</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Use the UUID from <code className="text-zinc-400">bnhub_listing_services.id</code> (e.g. from DB or support
          tools).
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-zinc-400">
            Listing service id
            <input
              value={listingServiceId}
              onChange={(e) => setListingServiceId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-200"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input type="checkbox" checked={restrict} onChange={(e) => setRestrict(e.target.checked)} />
            Admin disabled
          </label>
          <button
            type="button"
            onClick={() => void patchListingOffer()}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
