import Link from "next/link";
import { getGrowthCampaigns } from "@/lib/growth-acquisition";
import { GrowthFunnelDashboard } from "./growth-funnel-dashboard";
import { LaunchFirstCampaignPanel } from "./launch-first-campaign-panel";

export const dynamic = "force-dynamic";

export default async function AdminGrowthPage() {
  const campaigns = await getGrowthCampaigns({ limit: 50 });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://lecipm.com";

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Growth
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Growth & acquisition campaigns
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Referral, invite, and acquisition campaigns. Admins can create via POST{" "}
            <code className="text-slate-500">/api/admin/growth/campaigns</code> or use the launch
            panel below.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/admin" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              ← Back to Admin
            </Link>
            <Link href="/admin/growth/brain" className="text-sm font-medium text-violet-400 hover:text-violet-300">
              AI Growth Brain →
            </Link>
            <Link href="/admin/growth/pipeline" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              Growth CRM pipeline →
            </Link>
            <Link href="/admin/growth-metrics" className="text-sm font-medium text-amber-400 hover:text-amber-300">
              Launch metrics (signups · bookings · referrals) →
            </Link>
            <Link href="/admin/growth/launch-playbook" className="text-sm font-medium text-sky-400 hover:text-sky-300">
              Launch playbook (0→1000) →
            </Link>
            <Link href="/admin/bookings-ops" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              Booking ops →
            </Link>
            <Link href="/admin/reports/launch-quality" className="text-sm font-medium text-slate-400 hover:text-slate-300">
              Localization & listing quality →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <LaunchFirstCampaignPanel baseUrl={baseUrl} />
          </div>
          <GrowthFunnelDashboard />
          {campaigns.length === 0 ? (
            <p className="text-sm text-slate-500">No campaigns yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Start / End</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-slate-800/80">
                      <td className="px-4 py-3 font-medium text-slate-200">{c.name}</td>
                      <td className="px-4 py-3 text-slate-300">{c.campaignType}</td>
                      <td className="px-4 py-3 text-slate-300">{c.status}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(c.startAt).toISOString().slice(0, 10)} – {new Date(c.endAt).toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
