import type { SybnbMonitorEventRow, SybnbPaymentMonitorStats } from "@/lib/sybnb/monitoring";

function escrowTone(s: string): string {
  const u = s.toUpperCase();
  if (u === "HELD") return "bg-amber-100 text-amber-950 ring-amber-200";
  if (u === "ELIGIBLE") return "bg-sky-100 text-sky-950 ring-sky-200";
  if (u === "RELEASED") return "bg-emerald-100 text-emerald-950 ring-emerald-200";
  if (u === "BLOCKED") return "bg-red-100 text-red-950 ring-red-200";
  return "bg-stone-100 text-stone-800 ring-stone-200";
}

function eventTone(ev: string): string {
  const u = ev.toUpperCase();
  if (u.includes("BLOCK") || u.includes("DENIED") || u.includes("KILL")) return "text-red-800";
  if (u.includes("WEBHOOK") || u.includes("PAID")) return "text-emerald-800";
  if (u.includes("INTENT")) return "text-amber-900";
  return "text-stone-800";
}

type Props = {
  stats: SybnbPaymentMonitorStats;
  events: SybnbMonitorEventRow[];
  labels: {
    title: string;
    intro: string;
    attempts: string;
    blocked: string;
    webhookPaid: string;
    payoutsSection: string;
    recent: string;
    tableEvent: string;
    tableWhen: string;
    tableBooking: string;
    tableSummary: string;
    payoutHeld: string;
    payoutEligible: string;
    payoutReleased: string;
    payoutBlocked: string;
  };
};

export function SybnbPaymentsMonitor({ stats, events, labels }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{labels.title}</h2>
        <p className="text-sm text-stone-600">{labels.intro}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{labels.attempts}</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{stats.totalPaymentAttempts}</p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{labels.blocked}</p>
          <p className="mt-2 text-3xl font-semibold text-red-900">{stats.blockedPayments}</p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{labels.webhookPaid}</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-900">{stats.webhookPaidCompletions}</p>
        </article>
        <article className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-4 text-xs text-stone-600">
          <p className="font-semibold text-stone-800">{labels.payoutsSection}</p>
          <ul className="mt-2 space-y-1">
            <li className="flex justify-between gap-2">
              <span>{labels.payoutHeld}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${escrowTone("HELD")}`}>{stats.payoutsHeld}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>{labels.payoutEligible}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${escrowTone("ELIGIBLE")}`}>{stats.payoutsEligible}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>{labels.payoutReleased}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${escrowTone("RELEASED")}`}>{stats.payoutsReleased}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>{labels.payoutBlocked}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${escrowTone("BLOCKED")}`}>{stats.payoutsBlocked}</span>
            </li>
          </ul>
        </article>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-stone-800">{labels.recent}</h3>
        <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-2">{labels.tableEvent}</th>
                <th className="px-4 py-2">{labels.tableWhen}</th>
                <th className="px-4 py-2">{labels.tableBooking}</th>
                <th className="px-4 py-2">{labels.tableSummary}</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-stone-500" colSpan={4}>
                    —
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="border-t border-stone-100 align-top">
                    <td className={`px-4 py-2 font-mono text-xs font-medium ${eventTone(e.event)}`}>{e.event}</td>
                    <td className="px-4 py-2 text-xs text-stone-600">{e.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                    <td className="px-4 py-2 font-mono text-xs text-stone-700">{e.bookingId ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-stone-600">{e.summary ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
