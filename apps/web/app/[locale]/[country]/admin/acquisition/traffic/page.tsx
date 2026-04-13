import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { getAcquisitionSignupInsights } from "@/lib/admin/acquisition-signup-insights";

export const dynamic = "force-dynamic";

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export default async function AdminAcquisitionTrafficPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  const insights = await getAcquisitionSignupInsights(30);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">Acquisition</p>
      <h1 className="mt-2 text-3xl font-semibold">Signup traffic (last {insights.days} days)</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Channels come from UTM first-touch cookies, optional <code className="rounded bg-slate-800 px-1">?src=</code> on{" "}
        <code className="rounded bg-slate-800 px-1">/auth/signup</code> (tiktok, instagram, facebook, outreach), and
        inferred source strings. “Verification rate” is users with a verified email ÷ signups in the window — a simple
        activation proxy for early growth.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/acquisition" className="text-emerald-400 hover:text-emerald-300">
          ← Listing acquisition board
        </Link>
        <Link href="/admin/early-users" className="text-emerald-400 hover:text-emerald-300">
          Early users CRM
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">New signups</p>
          <p className="mt-1 text-3xl font-semibold text-white">{insights.totalSignups}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Verified emails</p>
          <p className="mt-1 text-3xl font-semibold text-white">{insights.verifiedSignups}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Verification rate</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-300">{pct(insights.verificationRate)}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">By channel</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/80 text-slate-400">
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Signups</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {insights.byChannel.map((row) => (
                <tr key={row.channel} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 capitalize text-slate-200">{row.channel}</td>
                  <td className="px-4 py-3 text-slate-300">{row.signups}</td>
                  <td className="px-4 py-3 text-slate-300">{row.verified}</td>
                  <td className="px-4 py-3 text-emerald-300/90">
                    {row.signups === 0 ? "—" : pct(row.verified / row.signups)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">New users per day (UTC)</h2>
        <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-white/10 bg-slate-900/95 text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Day</th>
                <th className="px-4 py-2 font-medium">Signups</th>
                <th className="px-4 py-2 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody>
              {[...insights.byDay].reverse().map((d) => (
                <tr key={d.day} className="border-b border-white/5">
                  <td className="px-4 py-2 text-slate-300">{d.day}</td>
                  <td className="px-4 py-2">{d.count}</td>
                  <td className="px-4 py-2 text-emerald-300/80">{d.verified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
