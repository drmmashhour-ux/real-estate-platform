import Link from "next/link";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { getInvestorDashboard } from "@/lib/services/investorDashboard";
import { investorPlatformDemoMetrics } from "@/lib/demo/demoData";

export const dynamic = "force-dynamic";

/**
 * Tight company / platform KPIs (not the investor *portfolio* page at `/dashboard/investor`).
 * Uses the same payload as `GET /api/investor/platform-dashboard` (server-side; no browser secret).
 */
export default async function InvestorPlatformDashboardPage() {
  const data = isDemoMode
    ? { ...investorPlatformDemoMetrics, _demo: true as const }
    : { ...(await getInvestorDashboard()), _demo: false as const };

  const userToBookingPct = (data.users > 0 ? (data.bookings / data.users) * 100 : 0).toFixed(2);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-10 text-slate-900">
      <h1 className="text-3xl font-bold">Investor — platform KPIs</h1>
      <p className="text-sm text-slate-600">
        High-level company metrics, funnel, and AI impact. For LP portfolio details, use{" "}
        <Link className="font-medium text-slate-800 underline" href="/dashboard/investor">
          Portfolio dashboard
        </Link>
        .
      </p>

      <div className="space-y-2 text-base">
        <div>Users: {data.users.toLocaleString()}</div>
        <div>Listings: {data.listings.toLocaleString()}</div>
        <div>Bookings: {data.bookings.toLocaleString()}</div>
        <div>
          Revenue (sum of <code className="rounded bg-slate-100 px-1">Booking.totalCents</code>, USD): $
          {data.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
        <div>Users (7d / 30d): {data.users7d} / {data.users30d}</div>
        <div>User → booking (rough): {userToBookingPct}%</div>
        <div>AI listing optimizations: {data.aiImpact.toLocaleString()}</div>
        <div>AI execution log rows (autonomy audit): {data.aiRevenueLift.toLocaleString()}</div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-800">
        <h2 className="mb-2 font-semibold">Growth (30d funnel)</h2>
        {data.growth && "_demo" in data.growth && data.growth._demo ? (
          <p>{("message" in data.growth && data.growth.message) || "Demo — growth engine off"}</p>
        ) : data.growth && "recommendation" in data.growth && !data.growth._demo ? (
          <ul className="list-inside list-disc space-y-1 text-slate-700">
            <li>Visits: {data.growth.visits.toLocaleString()}</li>
            <li>Signups: {data.growth.signups.toLocaleString()}</li>
            <li>Bookings: {data.growth.bookings.toLocaleString()}</li>
            <li>Signup rate: {(data.growth.signupRate * 100).toFixed(2)}%</li>
            <li>Booking rate: {(data.growth.bookingRate * 100).toFixed(2)}%</li>
            <li>{data.growth.recommendation}</li>
          </ul>
        ) : null}
      </section>

      {data._demo ? <div className="font-medium text-amber-600">Demo mode</div> : null}
    </div>
  );
}
