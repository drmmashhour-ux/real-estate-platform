"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { Card } from "@/components/lecipm-ui/card";

type DealRow = {
  id: string;
  status: string;
  priceCents: number;
  buyer?: { name?: string | null; email?: string | null };
  seller?: { name?: string | null; email?: string | null };
};

export function DealsConsoleClient({ localeCountryPrefix }: { localeCountryPrefix: string }) {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deals", { credentials: "same-origin" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body?.error === "string" ? body.error : `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { deals?: DealRow[] };
      setDeals(Array.isArray(data?.deals) ? data.deals : []);
    } catch (e) {
      console.error("[DealsConsoleClient]", e);
      setError(e instanceof Error ? e.message : "Failed to load deals");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Deals</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-gold/40 hover:text-gold"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <Card className="animate-pulse text-neutral-500">Loading deals…</Card>
      ) : error ? (
        <Card className="border-red-900/60 bg-red-950/40 text-red-100">
          <p className="font-medium">Could not load deals</p>
          <p className="mt-1 text-sm opacity-90">{error}</p>
        </Card>
      ) : deals.length === 0 ? (
        <Card className="text-neutral-400">
          No deals in scope. Pipeline data appears when you are buyer, seller, or broker on a deal — or open the{" "}
          <Link href={`${localeCountryPrefix}/dashboard/deals`} className="text-gold underline">
            live deal workspace
          </Link>
          .
        </Card>
      ) : (
        <ul className="space-y-2">
          {deals.map((d) => (
            <li key={d.id}>
              <Link
                href={`${localeCountryPrefix}/dashboard/deals/${d.id}`}
                className="block rounded-lg bg-[#111111] p-4 transition hover:border hover:border-gold/30"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium capitalize text-neutral-200">{d.status.replace(/_/g, " ")}</span>
                  <span className="text-gold">${(d.priceCents / 100).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {(d.buyer?.name ?? d.buyer?.email ?? "Buyer") ?? "Buyer"} ↔{" "}
                  {(d.seller?.name ?? d.seller?.email ?? "Seller") ?? "Seller"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
