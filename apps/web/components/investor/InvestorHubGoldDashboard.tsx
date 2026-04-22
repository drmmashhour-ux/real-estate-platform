"use client";

export type InvestorRiskBand = "LOW" | "MEDIUM" | "HIGH";

export type InvestorHubGoldStat = {
  title: string;
  value: string;
  subtitle: string;
};

export type InvestorHubGoldPropertyRow = {
  name: string;
  location: string;
  revenue: string;
  occupancy: string;
  risk: InvestorRiskBand;
};

export type InvestorHubGoldAlert = {
  severity: "warning" | "critical" | "positive";
  message: string;
};

export type InvestorHubGoldInsight = string;

export type InvestorHubGoldOpportunity = string;

export type InvestorHubGoldDashboardProps = {
  stats?: InvestorHubGoldStat[];
  properties?: InvestorHubGoldPropertyRow[];
  alerts?: InvestorHubGoldAlert[];
  insights?: InvestorHubGoldInsight[];
  opportunities?: InvestorHubGoldOpportunity[];
};

const DEFAULT_STATS: InvestorHubGoldStat[] = [
  { title: "Portfolio Value", value: "$1.24M", subtitle: "+3.2%" },
  { title: "Monthly Revenue", value: "$12.4K", subtitle: "+8.1%" },
  { title: "ROI", value: "8.2%", subtitle: "Last 30 days" },
  { title: "Risk Level", value: "Medium", subtitle: "Stable" },
  { title: "Properties", value: "12", subtitle: "Active" },
];

const DEFAULT_PROPERTIES: InvestorHubGoldPropertyRow[] = [
  {
    name: "Downtown Condo",
    location: "Montreal",
    revenue: "$2,300",
    occupancy: "82%",
    risk: "LOW",
  },
  {
    name: "Airbnb Loft",
    location: "Laval",
    revenue: "$3,100",
    occupancy: "74%",
    risk: "MEDIUM",
  },
  {
    name: "Luxury Villa",
    location: "Dubai",
    revenue: "$5,900",
    occupancy: "68%",
    risk: "HIGH",
  },
];

const DEFAULT_ALERTS: InvestorHubGoldAlert[] = [
  { severity: "warning", message: "High refund rate detected" },
  { severity: "critical", message: "Payout anomaly detected" },
  { severity: "positive", message: "Stable performance" },
];

const DEFAULT_INSIGHTS: InvestorHubGoldInsight[] = [
  "Increase price by 10% (high demand)",
  "Optimize listing description",
  "Review tenant risk signals",
];

const DEFAULT_OPPORTUNITIES: InvestorHubGoldOpportunity[] = [
  "High ROI area detected in Laval",
  "Undervalued property opportunity",
];

function StatCard({ title, value, subtitle }: InvestorHubGoldStat) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111] p-5 transition hover:border-[rgb(var(--premium-gold-channels)/0.4)]">
      <p className="text-sm text-slate-400">{title}</p>
      <h2 className="mt-1 text-2xl font-bold text-premium-gold">{value}</h2>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function RiskBadge({ level }: { level: InvestorRiskBand }) {
  const map: Record<InvestorRiskBand, string> = {
    LOW: "bg-emerald-500/20 text-emerald-400",
    MEDIUM: "bg-amber-500/20 text-amber-400",
    HIGH: "bg-red-500/20 text-red-400",
  };
  return <span className={`rounded px-2 py-1 text-xs ${map[level] ?? map.MEDIUM}`}>{level}</span>;
}

function AlertRow({ alert }: { alert: InvestorHubGoldAlert }) {
  const tone =
    alert.severity === "critical"
      ? "text-red-400"
      : alert.severity === "warning"
        ? "text-amber-400"
        : "text-emerald-400";
  const prefix =
    alert.severity === "critical" ? "Critical:" : alert.severity === "warning" ? "Warning:" : "";
  return (
    <li className={`text-sm ${tone}`}>
      {prefix ? `${prefix} ` : ""}
      {alert.message}
    </li>
  );
}

export function InvestorHubGoldDashboard({
  stats = DEFAULT_STATS,
  properties = DEFAULT_PROPERTIES,
  alerts = DEFAULT_ALERTS,
  insights = DEFAULT_INSIGHTS,
  opportunities = DEFAULT_OPPORTUNITIES,
}: InvestorHubGoldDashboardProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-premium-gold md:text-3xl">Investor overview</h2>
        <p className="mt-1 text-sm text-slate-400">Track performance, risk, and opportunities (illustrative sample data).</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-xl border border-white/10 bg-[#111] p-5">
            <h3 className="mb-4 text-lg font-semibold text-premium-gold">Property performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-slate-400">
                  <tr>
                    <th className="py-2 text-left">Property</th>
                    <th className="text-left">Revenue</th>
                    <th className="text-center">Occupancy</th>
                    <th className="text-center">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p) => (
                    <tr key={`${p.name}-${p.location}`} className="border-b border-white/[0.06]">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-white">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.location}</p>
                        </div>
                      </td>
                      <td className="text-slate-200">{p.revenue}</td>
                      <td className="text-center text-slate-300">{p.occupancy}</td>
                      <td className="text-center">
                        <RiskBadge level={p.risk} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111] p-5">
            <h3 className="mb-4 text-lg font-semibold text-premium-gold">Revenue trend</h3>
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-slate-500">
              Chart placeholder — connect Recharts / Chart.js when live metrics are wired.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-[#111] p-5">
            <h3 className="mb-4 text-lg font-semibold text-premium-gold">Alerts</h3>
            <ul className="space-y-3">
              {alerts.map((a) => (
                <AlertRow key={a.message} alert={a} />
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111] p-5">
            <h3 className="mb-4 text-lg font-semibold text-premium-gold">AI insights</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {insights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111] p-5">
            <h3 className="mb-4 text-lg font-semibold text-premium-gold">Opportunities</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {opportunities.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
