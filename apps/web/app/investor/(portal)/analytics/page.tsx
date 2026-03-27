import { getInvestorHubAnalytics } from "@/modules/investor/investor-analytics";
import { InvestorHubBarChart } from "@/components/investor/InvestorHubBarChart";

const GOLD = "#C9A646";

export default async function InvestorAnalyticsPage() {
  const data = await getInvestorHubAnalytics(30);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Platform analytics</h1>
      <p className="mt-1 text-sm text-slate-500">Hub attribution (trailing {data.days} days)</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {data.hubs.map((h) => (
          <div key={h.hub} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-semibold" style={{ color: GOLD }}>
              {h.label}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>
                <span className="text-slate-500">Listings / signals:</span> {h.listingsCreated.toLocaleString()}
              </li>
              <li>
                <span className="text-slate-500">Deals / leads:</span> {h.dealsOrLeads.toLocaleString()}
              </li>
              <li>
                <span className="text-slate-500">Rentals / bookings:</span> {h.rentalsOrBookings.toLocaleString()}
              </li>
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Daily volume by hub</h2>
        <div className="mt-4">
          <InvestorHubBarChart series={data.series} />
        </div>
      </div>
    </div>
  );
}
