import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { EquityAdminClient } from "@/components/admin/EquityAdminClient";
import type { Prisma } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getCapTableSnapshot } from "@/src/modules/equity/capTable";

export const dynamic = "force-dynamic";

type EquityGrantWithHolder = Prisma.EquityGrantGetPayload<{
  include: { holder: { select: { name: true; role: true } } };
}>;

export default async function AdminEquityPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  let snap: Awaited<ReturnType<typeof getCapTableSnapshot>> | null = null;
  let grants: EquityGrantWithHolder[] = [];
  let holders: { id: string; name: string; role: string }[] = [];

  try {
    snap = await getCapTableSnapshot();
    const [g, h] = await Promise.all([
      prisma.equityGrant.findMany({
        orderBy: { createdAt: "desc" },
        include: { holder: { select: { name: true, role: true } } },
      }),
      prisma.equityHolder.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, role: true } }),
    ]);
    grants = g;
    holders = h;
  } catch {
    /* migration pending */
  }

  const totalPct = snap?.rows.reduce((s, r) => s + r.equityPercent, 0) ?? 0;
  const dilutionNote =
    snap && snap.totalFullyDiluted > 0
      ? `Fully diluted base: ${snap.totalFullyDiluted.toLocaleString()} shares. Each % is pro-rata of FD; new issuance dilutes all rows proportionally.`
      : "Add grants to establish a fully diluted share base.";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Corporate</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Equity & cap table</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Ownership by holder, grant-level vesting with cliff + linear schedule, and investor exports (CSV / JSON).
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
              ← Admin home
            </Link>
            <Link href="/admin/fundraising" className="text-sky-400 hover:text-sky-300">
              Fundraising →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Fully diluted shares</p>
              <p className="mt-1 text-2xl font-semibold text-amber-200">
                {snap?.totalFullyDiluted.toLocaleString() ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Vested / unvested</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">
                {snap ? `${snap.totalVested.toLocaleString()} / ${snap.totalUnvested.toLocaleString()}` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">FD % check</p>
              <p className="mt-1 text-2xl font-semibold text-slate-200">{totalPct.toFixed(2)}%</p>
              <p className="mt-1 text-[11px] text-slate-600">Should sum to ~100% when cap table is complete.</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">{dilutionNote}</p>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Holders (fully diluted %)</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">FD shares</th>
                  <th className="py-2 pr-4">Vested</th>
                  <th className="py-2 pr-4">Unvested</th>
                  <th className="py-2">% FD</th>
                </tr>
              </thead>
              <tbody>
                {snap && snap.rows.length > 0 ? (
                  snap.rows.map((r) => (
                    <tr key={r.holderId} className="border-b border-slate-800/80">
                      <td className="py-2 pr-4 font-medium text-white">{r.name}</td>
                      <td className="py-2 pr-4 text-slate-400">{r.role}</td>
                      <td className="py-2 pr-4">{r.totalShares.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-emerald-300/90">{r.vestedShares.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-slate-500">{r.unvestedShares.toLocaleString()}</td>
                      <td className="py-2 font-mono text-amber-200/90">{r.equityPercent.toFixed(2)}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-slate-600">
                      No holders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Grants</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            {grants.map((g) => (
              <li key={g.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800 px-3 py-2">
                <span>
                  {g.holder.name} · {g.totalShares.toLocaleString()} sh · vested {g.vestedShares.toLocaleString()} ·{" "}
                  {g.vestingDuration}mo / cliff {g.cliffMonths}mo
                </span>
                <span className="font-mono text-[11px] text-slate-600">{g.id}</span>
              </li>
            ))}
            {grants.length === 0 ? <li className="text-slate-600">No grants.</li> : null}
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Actions</h2>
          <div className="mt-4 max-w-xl">
            <EquityAdminClient holders={holders} />
          </div>
          <p className="mt-12 text-center text-xs font-medium tracking-wide text-amber-400/90">
            LECIPM EQUITY SYSTEM ACTIVE
          </p>
        </div>
      </section>
    </main>
  );
}
