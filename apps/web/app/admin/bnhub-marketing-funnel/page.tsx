import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { loadBnhubMarketingFunnelDashboard } from "@/lib/bnhub/bnhub-marketing-funnel-analytics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BNHub marketing funnel",
  description: "First-users funnel: visitors, captures, signups, bookings, top listings.",
};

export default async function AdminBnhubMarketingFunnelPage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/en/ca/auth/login?next=/admin/bnhub-marketing-funnel");
  if (!(await isPlatformAdmin(guestId))) redirect("/");

  const dash = await loadBnhubMarketingFunnelDashboard(30);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">BNHub marketing funnel</h1>
          <p className="mt-1 text-sm text-slate-600">
            Last {dash.range.days} days ({new Date(dash.range.start).toLocaleDateString()} —{" "}
            {new Date(dash.range.end).toLocaleDateString()})
          </p>
        </div>
        <Link
          href="/bnhub/landing"
          className="text-sm font-medium text-rose-600 hover:text-rose-700"
        >
          Open landing →
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Landing visitors (/bnhub/landing)" value={dash.counts.visitors} />
        <MetricCard label="Email captures (this landing)" value={dash.counts.emailCaptures} />
        <MetricCard label="Account signups (platform)" value={dash.counts.accountSignups} />
        <MetricCard label="Bookings started" value={dash.counts.bookingStarted} />
        <MetricCard label="Bookings completed" value={dash.counts.bookingCompleted} />
      </div>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Conversion rates</h2>
        <p className="mt-1 text-xs text-slate-600">Denominators use landing visitors where noted.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <li className="rounded-xl bg-white p-4 shadow-sm">
            <span className="text-slate-500">Email capture / visitor</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{dash.rates.emailCaptureRate}%</p>
          </li>
          <li className="rounded-xl bg-white p-4 shadow-sm">
            <span className="text-slate-500">Account signup / visitor</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{dash.rates.signupRate}%</p>
          </li>
          <li className="rounded-xl bg-white p-4 shadow-sm">
            <span className="text-slate-500">Booking completed / visitor</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{dash.rates.bookingRate}%</p>
          </li>
          <li className="rounded-xl bg-white p-4 shadow-sm">
            <span className="text-slate-500">Booking completed / email capture</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{dash.rates.bookingFromEmailRate}%</p>
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Most viewed listings (BNHub paths)</h2>
        <p className="mt-1 text-sm text-slate-600">
          From <code className="text-xs">growth_events.listing_view</code> where path contains{" "}
          <code className="text-xs">bnhub</code>.
        </p>
        {dash.topListings.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No listing views in this window yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {dash.topListings.map((row) => (
              <li key={row.listingKey} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{row.title ?? row.listingKey}</p>
                  <p className="text-xs text-slate-500">
                    {row.city ? `${row.city} · ` : null}
                    <code>{row.listingKey}</code>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{row.views}</p>
                  <p className="text-xs text-slate-500">views</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
