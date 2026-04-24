"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type CountryRow = {
  id: string;
  code: string;
  name: string;
  currency: string;
  isActive: boolean;
  defaultLocale: string;
  supportedLocales: string[];
};

type CityRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
  status: string;
  isActive: boolean;
  listingsEnabled: boolean;
  searchPagesEnabled: boolean;
  growthEngineEnabled: boolean;
  expansionCountryId: string | null;
  expansionCountry: { id: string; code: string; name: string; currency: string } | null;
  publishedBnhubListings: number;
};

type MarketsPayload = {
  success?: boolean;
  countries?: CountryRow[];
  cities?: CityRow[];
  readiness?: { countryId: string; code: string; enabledFeatures: string[] }[];
  error?: string;
};

export function ExpansionControlClient() {
  const [data, setData] = useState<MarketsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/expansion/markets", { credentials: "include" });
      setData((await r.json()) as MarketsPayload);
    } catch {
      setData({ error: "fetch_failed" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchCity = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const r = await fetch(`/api/expansion/cities/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        await load();
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="text-sm text-zinc-500">Loading markets…</p>;

  if (!data?.success) {
    return (
      <Card className="border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
        {data?.error === "fetch_failed" ? "Network error." : "Unable to load markets (apply DB migration if needed)."}
        <div className="mt-3">
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const countries = data.countries ?? [];
  const cities = data.cities ?? [];

  return (
    <div className="space-y-6">
      <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Countries</h2>
        {countries.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">
            No rows in <code className="text-zinc-500">expansion_countries</code> yet. Add via Prisma / SQL, then attach
            cities with <code className="text-zinc-500">expansionCountryId</code>.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Currency</th>
                  <th className="py-2 pr-3">Locales</th>
                  <th className="py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-800/80">
                    <td className="py-2 pr-3 font-mono text-zinc-200">{c.code}</td>
                    <td className="py-2 pr-3 text-zinc-200">{c.name}</td>
                    <td className="py-2 pr-3 text-zinc-300">{c.currency}</td>
                    <td className="py-2 pr-3 text-zinc-400">
                      {c.supportedLocales?.length ? c.supportedLocales.join(", ") : c.defaultLocale}
                    </td>
                    <td className="py-2 text-zinc-400">{c.isActive ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          Taxes, fees, and rules live in <code className="text-zinc-600">regional_config_json</code> (and optional{" "}
          <code className="text-zinc-600">EXPANSION_REGIONAL_OVERRIDES_JSON</code>).
        </p>
      </Card>

      <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Cities & performance</h2>
        <p className="mt-2 text-xs text-zinc-500">
          Published BNHub stays counted by <code className="text-zinc-600">marketCityId</code> (backfill FKs to grow
          accuracy).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="py-2 pr-2">City</th>
                <th className="py-2 pr-2">Country</th>
                <th className="py-2 pr-2">Published stays</th>
                <th className="py-2 pr-2">Market active</th>
                <th className="py-2 pr-2">Listings on</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => (
                <tr key={c.id} className="border-b border-zinc-800/80">
                  <td className="py-2 pr-2">
                    <span className="text-zinc-100">{c.name}</span>
                    <div className="font-mono text-xs text-zinc-500">{c.slug}</div>
                  </td>
                  <td className="py-2 pr-2 text-zinc-400">
                    {c.expansionCountry?.code ?? c.country}
                    {c.expansionCountry ? (
                      <span className="text-zinc-600"> · {c.expansionCountry.currency}</span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-2 font-mono text-zinc-300">{c.publishedBnhubListings}</td>
                  <td className="py-2 pr-2 text-zinc-400">{c.isActive ? "yes" : "no"}</td>
                  <td className="py-2 pr-2 text-zinc-400">{c.listingsEnabled ? "yes" : "no"}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busyId === c.id}
                        onClick={() => void patchCity(c.id, { isActive: !c.isActive })}
                      >
                        Toggle active
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busyId === c.id}
                        onClick={() => void patchCity(c.id, { listingsEnabled: !c.listingsEnabled })}
                      >
                        Toggle listings
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
