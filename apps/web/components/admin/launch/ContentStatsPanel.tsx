"use client";

import type { LaunchDailyRow, LaunchMetricKey } from "@/lib/launch-tracking/metrics";

type Props = {
  totals: Record<LaunchMetricKey, number>;
  series: LaunchDailyRow[];
};

const KEYS: LaunchMetricKey[] = ["postsCreated", "contentViews", "contentClicks", "contentConversions"];

const LABELS: Record<LaunchMetricKey, string> = {
  messagesSent: "Messages sent",
  repliesReceived: "Replies received",
  demosBooked: "Demos booked",
  demosCompleted: "Demos completed",
  usersCreated: "Users created",
  activatedUsers: "Activated users",
  payingUsers: "Paying users",
  postsCreated: "Posts created",
  contentViews: "Views",
  contentClicks: "Clicks",
  contentConversions: "Conversions",
};

export function ContentStatsPanel({ totals, series }: Props) {
  const last7 = series.slice(-7);
  const ctr = totals.contentViews > 0 ? ((totals.contentClicks / totals.contentViews) * 100).toFixed(1) : "—";
  const cvr =
    totals.contentClicks > 0 ? ((totals.contentConversions / totals.contentClicks) * 100).toFixed(1) : "—";

  return (
    <section className="rounded-xl border border-white/10 bg-black/30 p-5">
      <h2 className="text-lg font-medium text-slate-100">Content</h2>
      <p className="mt-1 text-xs text-slate-500">
        Period CTR {ctr}% · click→conv {cvr}%
      </p>
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
                <th className="py-2 pr-2">Posts</th>
                <th className="py-2 pr-2">Views</th>
                <th className="py-2 pr-2">Clicks</th>
                <th className="py-2">Conv</th>
              </tr>
            </thead>
            <tbody>
              {last7.map((r) => (
                <tr key={r.date} className="border-b border-white/5">
                  <td className="py-1.5 pr-2 text-slate-300">{r.date}</td>
                  <td className="py-1.5 pr-2">{r.postsCreated}</td>
                  <td className="py-1.5 pr-2">{r.contentViews}</td>
                  <td className="py-1.5 pr-2">{r.contentClicks}</td>
                  <td className="py-1.5">{r.contentConversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
