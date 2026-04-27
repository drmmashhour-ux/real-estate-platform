import { redirect } from "next/navigation";

import { getAcquisitionInsights } from "@/lib/growth/acquisitionInsights";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

function accentRow(isTop: boolean) {
  if (isTop) {
    return "border-amber-500/50 bg-amber-950/20 ring-1 ring-amber-500/30";
  }
  return "border-zinc-800/80";
}

export default async function AdminAcquisitionInsightsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/admin`;

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(`${base}`);
  }

  const insights = await getAcquisitionInsights().catch(() => null);
  const top = insights?.topChannel;

  return (
    <div className="min-h-screen space-y-8 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">BNHub · LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">Acquisition intelligence</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          First-touch channel mix from signup attribution. One row = one user (no double-counting). Funnel: onboarding
          complete · guest booking (confirmed or completed).
        </p>
        <a href={base} className="mt-3 inline-block text-sm text-[#D4AF37] hover:underline">
          ← Admin home
        </a>
      </div>

      {!insights ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-100">
          Could not load acquisition insights. Try again later.
        </div>
      ) : null}

      {insights && insights.totalUsers === 0 ? (
        <p className="text-sm text-zinc-500">No non-visitor users yet — percentages will show once signups exist.</p>
      ) : null}

      {insights && insights.totalUsers > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a]">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Channel mix</h2>
            <p className="mt-1 text-xs text-zinc-500">Top row highlighted — canonical sources: tiktok, meta, google, referral, direct, organic.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">Share</th>
                  <th className="px-4 py-3">Onboarded</th>
                  <th className="px-4 py-3">Converted (booking)</th>
                  <th className="px-4 py-3">Conv. rate (src)</th>
                </tr>
              </thead>
              <tbody>
                {insights.channels.map((c) => {
                  const isTop = c.source === top;
                  return (
                    <tr key={c.source} className={`border-b last:border-0 ${accentRow(!!isTop && (c.users ?? 0) > 0)}`}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-100">
                        {c.source}
                        {isTop && (c.users ?? 0) > 0 ? (
                          <span className="ml-2 rounded-full border border-amber-500/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">
                            Top
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-200">{c.users}</td>
                      <td className="px-4 py-3 tabular-nums text-zinc-200">{c.percentage.toFixed(1)}%</td>
                      <td className="px-4 py-3 tabular-nums text-zinc-400">{c.onboardedUsers}</td>
                      <td className="px-4 py-3 tabular-nums text-zinc-400">{c.convertedUsers}</td>
                      <td className="px-4 py-3 tabular-nums text-zinc-400">
                        {c.conversionRate == null ? "—" : `${c.conversionRate.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
