"use client";

import { useEffect, useState } from "react";
import { RevenueCard } from "./RevenueCard";
import { OccupancyChart } from "./OccupancyChart";
import { AutopilotPanel } from "./AutopilotPanel";
import { ListingHealthCard } from "./ListingHealthCard";

type DashPayload = {
  revenueMTD?: number;
  occupancyRate?: number;
  bookingsThisMonth?: number;
  upcomingGuests?: number;
  totalEarningsCents?: number;
  revenueByDay?: { date: string; cents: number }[];
  hostAutopilot?: {
    mode: string;
    autoMessaging: boolean;
    autoPricing: boolean;
    paused: boolean;
  } | null;
};

export function HostDashboardV2({ ownerId }: { ownerId: string }) {
  const [data, setData] = useState<DashPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/bnhub/host/dashboard?ownerId=${encodeURIComponent(ownerId)}`, {
          credentials: "include",
        });
        const j = (await res.json()) as DashPayload & { error?: string };
        if (!res.ok) throw new Error(j.error ?? "Failed");
        setData(j);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
      }
    })();
  }, [ownerId]);

  if (err) {
    return <p className="text-sm text-red-300">BNHub v2 dashboard: {err}</p>;
  }
  if (!data) {
    return <p className="text-sm text-neutral-500">Loading host insights…</p>;
  }

  const mtdCents = typeof data.revenueMTD === "number" ? data.revenueMTD : 0;
  /** Already 0–100 from `getOccupancyRateLast30`. */
  const occPct = typeof data.occupancyRate === "number" ? data.occupancyRate : 0;

  return (
    <div className="space-y-4 rounded-2xl border border-premium-gold/25 bg-black/40 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Host dashboard v2</h2>
        <p className="text-xs text-neutral-500">Revenue and autopilot — Stripe remains the payment rail for guests.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <RevenueCard label="Revenue MTD (host payout)" cents={mtdCents} />
        <RevenueCard label="Total earnings" cents={data.totalEarningsCents ?? 0} />
        <ListingHealthCard occupancyPct={occPct} bookingsThisMonth={data.bookingsThisMonth ?? 0} />
      </div>
      {data.revenueByDay && data.revenueByDay.length > 0 && <OccupancyChart points={data.revenueByDay} />}
      <AutopilotPanel settings={data.hostAutopilot ?? null} />
    </div>
  );
}
