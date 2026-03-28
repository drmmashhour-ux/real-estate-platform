import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export type SellerDashboardListingRow = {
  id: string;
  title: string;
  city: string;
  updatedAt: string;
  listingCode: string | null;
  uxLabel: string;
  uxBadgeClass: string;
  trustScore: number | null;
};

export type SellerDashboardIssueRow = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

export function SellerDashboardTrustOverview({
  firstName,
  stats,
  listings,
  issues,
}: {
  firstName: string;
  stats: {
    avgTrust: number | null;
    verifiedPct: number;
    actionRequired: number;
    leadsActivity: number;
  };
  listings: SellerDashboardListingRow[];
  issues: SellerDashboardIssueRow[];
}) {
  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-premium-gold/90">Seller hub</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-2 text-sm text-[#A1A1A1]">Trust-first overview — scores, verification, and what to fix next.</p>
        </div>
        <Link
          href="/dashboard/seller/create"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-premium-gold px-6 py-3 text-sm font-bold text-[#0B0B0B] shadow-[0_0_24px_rgb(var(--premium-gold-channels) / 0.35)] transition duration-200 hover:bg-premium-gold"
        >
          Add listing
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card hoverable glow className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A1A1A1]">Avg trust score</p>
          <p className="mt-3 font-serif text-3xl font-bold tabular-nums text-white">
            {stats.avgTrust != null ? stats.avgTrust : "—"}
          </p>
          <p className="mt-1 text-xs text-[#A1A1A1]">Across listings with scores</p>
        </Card>
        <Card hoverable className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A1A1A1]">Listings verified</p>
          <p className="mt-3 font-serif text-3xl font-bold tabular-nums text-premium-gold">{stats.verifiedPct}%</p>
          <p className="mt-1 text-xs text-[#A1A1A1]">Identity verified</p>
        </Card>
        <Card hoverable className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A1A1A1]">Action required</p>
          <p className="mt-3 font-serif text-3xl font-bold tabular-nums text-amber-200">{stats.actionRequired}</p>
          <p className="mt-1 text-xs text-[#A1A1A1]">Open tasks &amp; follow-ups</p>
        </Card>
        <Card hoverable className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A1A1A1]">Leads / activity</p>
          <p className="mt-3 font-serif text-3xl font-bold tabular-nums text-white">{stats.leadsActivity}</p>
          <p className="mt-1 text-xs text-[#A1A1A1]">Inquiries on your listings</p>
        </Card>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SectionHeader title="Your listings" subtitle="Status, trust, and quick links." />
          {listings.length === 0 ? (
            <EmptyState
              title="No listings yet"
              description="Create your first listing to run verification and readiness checks."
              action={
                <Link
                  href="/dashboard/seller/create"
                  className="rounded-full bg-premium-gold px-5 py-2.5 text-sm font-bold text-[#0B0B0B]"
                >
                  Create listing
                </Link>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212]">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A1A1A1]">
                    <th className="px-4 py-3">Listing</th>
                    <th className="px-4 py-3">Trust</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((row) => (
                    <tr key={row.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/seller/listings/${row.id}`} className="font-medium text-premium-gold hover:underline">
                          {row.title}
                        </Link>
                        <p className="text-xs text-[#A1A1A1]">
                          {row.city}
                          {row.listingCode ? (
                            <>
                              {" "}
                              · <span className="font-mono text-slate-500">{row.listingCode}</span>
                            </>
                          ) : null}
                        </p>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-white">{row.trustScore != null ? row.trustScore : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.uxBadgeClass}`}>{row.uxLabel}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[#A1A1A1]">{row.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <SectionHeader title="Issues to fix" subtitle="Prioritized from scores and documents." />
          <Card className="p-5">
            {issues.length === 0 ? (
              <p className="text-sm text-[#A1A1A1]">You’re clear — no open issues flagged.</p>
            ) : (
              <ul className="space-y-3">
                {issues.map((issue) => (
                  <li key={issue.id}>
                    <Link href={issue.href} className="group block rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-premium-gold/35">
                      <p className="text-sm font-medium text-white group-hover:text-premium-gold">{issue.title}</p>
                      <p className="mt-1 text-xs text-[#A1A1A1]">{issue.detail}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
