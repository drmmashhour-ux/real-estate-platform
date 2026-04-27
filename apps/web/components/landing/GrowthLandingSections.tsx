import { FUNNEL_MATH_ROWS, GROWTH_REMINDERS, GROWTH_VALUE_PITCH } from "@/lib/growth/early-trust-content";

/** Manual-first positioning + illustrative funnel (not a financial guarantee). */
export function ManualHelpCallout() {
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-4 py-4 text-left text-sm text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-50/95">
      <p className="font-semibold">Personal help is the edge</p>
      <p className="mt-1 text-emerald-900/90 dark:text-emerald-100/85">{GROWTH_VALUE_PITCH.manualEdge}</p>
      <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-200/70">Big teams do not sit in the DMs with travelers. You can.</p>
    </div>
  );
}

export function RealisticFunnelTable() {
  return (
    <div className="mx-auto mt-10 max-w-lg text-left">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Realistic funnel (illustrative)</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Model your own AOV and net take — use this as a planning grid, not a promise.</p>
      <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/80">
            <tr>
              <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Step</th>
              <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {FUNNEL_MATH_ROWS.map((row) => (
              <tr key={row.step} className="bg-white/80 dark:bg-zinc-950/40">
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{row.step}</td>
                <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{row.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GrowthRealityList() {
  return (
    <div className="mx-auto mt-8 grid max-w-lg gap-4 text-left sm:grid-cols-2">
      <div className="rounded-lg border border-red-200/80 bg-red-50/50 px-3 py-2 dark:border-red-500/20 dark:bg-red-950/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-red-200/90">Not required for v1</p>
        <ul className="mt-1 list-inside list-disc text-sm text-red-900/90 dark:text-red-100/80">
          {GROWTH_REMINDERS.skipForNow.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-sky-200/80 bg-sky-50/50 px-3 py-2 dark:border-sky-500/20 dark:bg-sky-950/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-200/90">You need</p>
        <ul className="mt-1 list-inside list-disc text-sm text-sky-900/90 dark:text-sky-100/85">
          {GROWTH_REMINDERS.youNeed.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
