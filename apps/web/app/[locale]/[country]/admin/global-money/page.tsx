import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { revenueAutomationFlags } from "@/config/feature-flags";
import { getMosMarketRuntime } from "@/config/country";
import { buildGlobalMoneyOsView } from "@/modules/revenue/global-money-os.service";

export const dynamic = "force-dynamic";

function fmtMoney(n: number | null, currency: string) {
  if (n == null) return "—";
  const locale =
    currency === "CAD" ? "en-CA" : currency === "AED" ? "ar-AE" : "en-US";
  return n.toLocaleString(locale, { style: "currency", currency, maximumFractionDigits: 0 });
}

export default async function AdminGlobalMoneyPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdminSurface(uid))) redirect("/admin");

  const view = revenueAutomationFlags.globalMosV1 ? await buildGlobalMoneyOsView() : null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Money OS · Global</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Cross-market view</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{view?.isolationNote}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
            ← Admin home
          </Link>
          <Link href="/admin/money" className="text-violet-400 hover:text-violet-300">
            Money command center
          </Link>
        </div>

        {!view ? (
          <p className="mt-10 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
            Enable <code className="text-violet-300">FEATURE_GLOBAL_MOS_V1</code> to load this view.
          </p>
        ) : (
          <section className="mt-10 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Market</th>
                  <th className="px-4 py-3">Week revenue</th>
                  <th className="px-4 py-3">Unlock rate</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {view.markets.map((m) => (
                  <tr key={m.countryCode} className="border-b border-slate-800/80">
                    <td className="px-4 py-3 font-medium text-white">
                      {m.countryCode}
                      {m.isThisDeployment ? (
                        <span className="ml-2 rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] text-emerald-300">
                          this deployment
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-200">
                      {m.isThisDeployment ? fmtMoney(m.revenueWeekCad, deploymentCurrency) : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">
                      {m.conversionUnlockRate != null ? `${(m.conversionUnlockRate * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">{m.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}
