"use client";

import type { LaunchDailyRow, LaunchMetricKey } from "@/lib/launch-tracking/metrics";

type Props = {
  totals: Record<LaunchMetricKey, number>;
  series: LaunchDailyRow[];
};

const KEYS: LaunchMetricKey[] = [
  "messagesSent",
  "repliesReceived",
  "demosBooked",
  "demosCompleted",
];

const LABELS: Record<LaunchMetricKey, string> = {
  messagesSent: "Messages sent",
  repliesReceived: "Replies received",
  demosBooked: "Demos booked",
  demosCompleted: "Demos completed",
  usersCreated: "Users created",
  activatedUsers: "Activated users",
  payingUsers: "Paying users",
  postsCreated: "Posts created",
  contentViews: "Content views",
  contentClicks: "Content clicks",
  contentConversions: "Content conversions",
};

export function OutreachStatsPanel({ totals, series }: Props) {
  const last7 = series.slice(-7);
  return (
    <section className="rounded-xl border border-white/10 bg-black/30 p-5">
      <h2 className="text-lg font-medium text-slate-100">Outreach</h2>
      <p className="mt-1 text-xs text-slate-500">Period totals + last 7 days</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {KEYS.map((k) => (
          <li key={k} className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">{LABELS[k]}</p>
            <p className="text-2xl font-semibold text-slate-100">{totals[k]}</p>
          </li>
        ))}
      </ul>
      {last7.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-400">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-2">Date</th>
                <th className="py-2 pr-2">Msg</th>
                <th className="py-2 pr-2">Reply</th>
                <th className="py-2 pr-2">Booked</th>
                <th className="py-2">Done</th>
              </tr>
            </thead>
            <tbody>
              {last7.map((r) => (
                <tr key={r.date} className="border-b border-white/5">
                  <td className="py-1.5 pr-2 text-slate-300">{r.date}</td>
                  <td className="py-1.5 pr-2">{r.messagesSent}</td>
                  <td className="py-1.5 pr-2">{r.repliesReceived}</td>
                  <td className="py-1.5 pr-2">{r.demosBooked}</td>
                  <td className="py-1.5">{r.demosCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
