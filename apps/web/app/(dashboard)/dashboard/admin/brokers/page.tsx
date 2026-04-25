import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getBrokerAdminSnapshot } from "@/modules/growth/broker-admin.service";
import { getBrokerGrowthMetrics } from "@/modules/growth/broker-metrics.service";

export const dynamic = "force-dynamic";

export default async function AdminBrokersGrowthPage() {
  const a = await requireAdminSession();
  if (!a.ok) {
    redirect(`/auth/login?next=${encodeURIComponent("/dashboard/admin/brokers")}`);
  }

  const [metrics, snapshot] = await Promise.all([getBrokerGrowthMetrics(), getBrokerAdminSnapshot()]);
  const activeSet = new Set(snapshot.activeBrokerIds);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 text-slate-100">
      <div>
        <h1 className="text-2xl font-semibold text-white">Broker acquisition</h1>
        <p className="mt-1 text-sm text-slate-400">
          Funnel health, activation (3+ lead views or AI / contact), and recent signups.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total brokers", value: metrics.totalBrokers },
          { label: "New (7d)", value: metrics.newBrokers7d },
          { label: "Active (rules)", value: metrics.activeBrokers },
          { label: "Activation rate", value: `${(metrics.activationRate * 100).toFixed(1)}%` },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
            <p className="text-xs uppercase text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{c.value}</p>
          </div>
        ))}
      </section>
      <p className="text-xs text-slate-500">
        Retention (14d): {(metrics.retentionRate14d * 100).toFixed(1)}% of brokers had any activity event in the last 14 days.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-white">New brokers (14d)</h2>
        <ul className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10">
          {snapshot.newBrokers.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">No new broker signups in the last 14 days.</li>
          ) : (
            snapshot.newBrokers.map((b) => (
              <li key={b.id} className="flex flex-wrap justify-between gap-2 px-4 py-2 text-sm">
                <span className="text-slate-200">{b.name ?? b.email}</span>
                <span className="font-mono text-xs text-slate-500">{b.id.slice(0, 8)}…</span>
                <span className="text-xs text-slate-500">{b.createdAt.toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Top performers (open pipeline work)</h2>
        <ul className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10">
          {snapshot.topPerformers.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
              <span className="text-slate-200">{b.name ?? b.email}</span>
              <span className="text-slate-400">Open leads: {b.openLeads}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                  activeSet.has(b.id) ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-600/40 text-slate-400"
                }`}
              >
                {activeSet.has(b.id) ? "Active" : "Not active"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
