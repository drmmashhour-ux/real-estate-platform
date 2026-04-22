"use client";

import Link from "next/link";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
};

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5 transition hover:border-[#D4AF37]/40">
      <p className="text-sm text-gray-400">{title}</p>
      <h2 className="mt-1 text-2xl font-bold text-[#D4AF37]">{value}</h2>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

const RISK_BADGE_CLASS: Record<RiskLevel, string> = {
  LOW: "bg-green-500/20 text-green-400",
  MEDIUM: "bg-yellow-500/20 text-yellow-400",
  HIGH: "bg-red-500/20 text-red-400",
};

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`rounded px-2 py-1 text-xs ${RISK_BADGE_CLASS[level]}`}>{level}</span>
  );
}

type PropertyRow = {
  id: string;
  name: string;
  location: string;
  revenue: string;
  occupancy: string;
  risk: RiskLevel;
};

const DEMO_PROPERTIES: PropertyRow[] = [
  {
    id: "p1",
    name: "Downtown Condo",
    location: "Montreal",
    revenue: "$2,300",
    occupancy: "82%",
    risk: "LOW",
  },
  {
    id: "p2",
    name: "Airbnb Loft",
    location: "Laval",
    revenue: "$3,100",
    occupancy: "74%",
    risk: "MEDIUM",
  },
  {
    id: "p3",
    name: "Luxury Villa",
    location: "Dubai",
    revenue: "$5,900",
    occupancy: "68%",
    risk: "HIGH",
  },
];

/** Prototype investor dashboard UI (demo data). Full workspace: localized `/dashboard/investor`. */
export default function InvestorDashboardPrototype() {
  const fullHubHref = `/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/dashboard/investor`;

  return (
    <div className="min-h-screen space-y-8 bg-black p-6 text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]">Investor Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">Track performance, risk, and opportunities</p>
        </div>
        <Link
          href={fullHubHref}
          className="text-sm text-[#D4AF37] underline-offset-4 hover:underline"
        >
          Open full investor workspace
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard title="Portfolio Value" value="$1.24M" subtitle="+3.2%" />
        <StatCard title="Monthly Revenue" value="$12.4K" subtitle="+8.1%" />
        <StatCard title="ROI" value="8.2%" subtitle="Last 30 days" />
        <StatCard title="Risk Level" value="Medium" subtitle="Stable" />
        <StatCard title="Properties" value="12" subtitle="Active" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-xl border border-[#222] bg-[#111] p-5">
            <h2 className="mb-4 text-lg font-semibold text-[#D4AF37]">Property Performance</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#222] text-gray-400">
                  <tr>
                    <th className="py-2 text-left">Property</th>
                    <th className="text-left">Revenue</th>
                    <th>Occupancy</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_PROPERTIES.map((p) => (
                    <tr key={p.id} className="border-b border-[#1a1a1a]">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.location}</p>
                        </div>
                      </td>
                      <td>{p.revenue}</td>
                      <td className="text-center">{p.occupancy}</td>
                      <td className="text-center">
                        <RiskBadge level={p.risk} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-[#222] bg-[#111] p-5">
            <h2 className="mb-4 text-lg font-semibold text-[#D4AF37]">Revenue Trend</h2>
            <div className="flex h-48 items-center justify-center text-gray-500">
              Chart placeholder (Recharts / Chart.js)
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#222] bg-[#111] p-5">
            <h2 className="mb-4 text-lg font-semibold text-[#D4AF37]">Alerts</h2>
            <ul className="space-y-3 text-sm">
              <li className="text-yellow-400">High refund rate detected</li>
              <li className="text-red-400">Payout anomaly detected</li>
              <li className="text-green-400">Stable performance</li>
            </ul>
          </div>

          <div className="rounded-xl border border-[#222] bg-[#111] p-5">
            <h2 className="mb-4 text-lg font-semibold text-[#D4AF37]">AI Insights</h2>
            <ul className="space-y-3 text-sm">
              <li>Increase price by 10% (high demand)</li>
              <li>Optimize listing description</li>
              <li>Review tenant risk signals</li>
            </ul>
          </div>

          <div className="rounded-xl border border-[#222] bg-[#111] p-5">
            <h2 className="mb-4 text-lg font-semibold text-[#D4AF37]">Opportunities</h2>
            <ul className="space-y-3 text-sm">
              <li>High ROI area detected in Laval</li>
              <li>Undervalued property opportunity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
