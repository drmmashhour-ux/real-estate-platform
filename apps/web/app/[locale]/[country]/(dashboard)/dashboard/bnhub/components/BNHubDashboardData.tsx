"use client";

import { useEffect, useState } from "react";
import { HubStatCard } from "@/components/hub/HubStatCard";
import type { HubTheme } from "@/lib/hub/themes";

type DashboardData = {
  bookingsThisMonth: number;
  occupancyRate: number;
  upcomingGuests: number;
  revenueMTD: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueYTD: number;
};

export function BNHubDashboardData({ theme }: { theme: HubTheme }) {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/bnhub/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, []);

  if (data === null) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.text }}>
          Bookings & occupancy
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HubStatCard theme={theme} label="Bookings (month)" value="…" sub="Loading" accent={theme.accent} />
          <HubStatCard theme={theme} label="Occupancy %" value="…" sub="Last 30 days" accent={theme.accent} />
          <HubStatCard theme={theme} label="Upcoming guests" value="…" sub="Next 7 days" accent={theme.accent} />
          <HubStatCard theme={theme} label="Revenue (MTD)" value="…" sub="Month to date" accent={theme.accent} />
        </div>
      </section>
    );
  }

  return (
    <>
      <section>
        <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.text }}>
          Bookings & occupancy
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HubStatCard
            theme={theme}
            label="Bookings (month)"
            value={String(data.bookingsThisMonth)}
            sub="Active"
            accent={theme.accent}
          />
          <HubStatCard
            theme={theme}
            label="Occupancy %"
            value={`${data.occupancyRate}%`}
            sub="Last 30 days"
            accent={theme.accent}
          />
          <HubStatCard
            theme={theme}
            label="Upcoming guests"
            value={String(data.upcomingGuests)}
            sub="Next 7 days"
            accent={theme.accent}
          />
          <HubStatCard
            theme={theme}
            label="Revenue (MTD)"
            value={`$${(data.revenueMTD / 100).toFixed(0)}`}
            sub="Month to date"
            accent={theme.accent}
          />
        </div>
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.text }}>
          Revenue summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <HubStatCard
            theme={theme}
            label="This month"
            value={`$${(data.revenueThisMonth / 100).toFixed(0)}`}
            accent={theme.accent}
          />
          <HubStatCard
            theme={theme}
            label="Last month"
            value={`$${(data.revenueLastMonth / 100).toFixed(0)}`}
            accent={theme.accent}
          />
          <HubStatCard
            theme={theme}
            label="YTD"
            value={`$${(data.revenueYTD / 100).toFixed(0)}`}
            accent={theme.accent}
          />
        </div>
      </section>
    </>
  );
}
