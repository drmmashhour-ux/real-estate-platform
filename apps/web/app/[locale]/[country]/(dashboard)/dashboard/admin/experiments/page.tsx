import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getExperimentResults, listExperiments } from "@/lib/experiments/engine";

export const dynamic = "force-dynamic";

function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${(n * 100).toFixed(1)}%`;
}

export default async function AdminExperimentsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/admin`;

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(base);
  }

  const exps = await listExperiments().catch(() => []);
  const withResults = await Promise.all(
    exps.map(async (e) => ({ exp: e, results: await getExperimentResults(e.slug) }))
  );

  return (
    <div className="min-h-screen space-y-10 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Order 59</p>
        <h1 className="mt-2 text-2xl font-bold">Experiments (A/B)</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Assignments are stable; results are read-only. No automatic rollouts, price changes, or urgency / dark patterns.
          Requires <code className="font-mono text-zinc-500">FEATURE_RECO=1</code> for live variant exposure and
          telemetry. Set <code className="font-mono text-zinc-500">hero_cta_copy</code> to <strong>running</strong> in the
          DB to activate the shipped hero CTA test (default seed is <code className="font-mono">draft</code>).
        </p>
        <Link href={base} className="mt-3 inline-block text-sm text-[#D4AF37] hover:underline">
          ← Admin home
        </Link>
      </div>

      {withResults.length === 0 ? (
        <p className="text-sm text-zinc-500">No experiments yet. Apply migrations and seed.</p>
      ) : null}

      <div className="space-y-8">
        {withResults.map(({ exp, results }) => {
          if (!results) return null;
          return (
            <section key={exp.id} className="overflow-hidden rounded-2xl border border-zinc-800">
              <div className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-3">
                <h2 className="font-mono text-sm font-semibold text-white">{exp.slug}</h2>
                <p className="text-xs text-zinc-500">
                  {exp.name} — status: <span className="text-zinc-300">{exp.status}</span>
                </p>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                      <th className="py-2 pr-4">Variant</th>
                      <th className="py-2 pr-4">Label</th>
                      <th className="py-2 pr-4">Users</th>
                      <th className="py-2 pr-4">Events</th>
                      <th className="py-2">Conversion (signup / users)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.variants.map((v) => (
                      <tr key={v.variantKey} className="border-b border-zinc-800/60">
                        <td className="py-2 font-mono text-zinc-200">{v.variantKey}</td>
                        <td className="max-w-xs py-2 text-zinc-400">{v.name}</td>
                        <td className="py-2 tabular-nums text-zinc-300">{v.users}</td>
                        <td className="py-2 tabular-nums text-zinc-300">{v.events}</td>
                        <td className="py-2 tabular-nums text-[#D4AF37]">{pct(v.conversionRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-zinc-500">
                  Detected winner (advisory):{" "}
                  {results.winner.key ? (
                    <span className="text-zinc-200">
                      {results.winner.key} ({results.winner.confidence} confidence)
                    </span>
                  ) : (
                    <span className="text-zinc-500">none (minimum sample or lift not met)</span>
                  )}
                </p>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
