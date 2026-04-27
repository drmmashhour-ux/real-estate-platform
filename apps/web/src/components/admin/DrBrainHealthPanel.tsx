import type { DrBrainReport } from "@repo/drbrain";

export function DrBrainHealthPanel(props: { report: DrBrainReport; title: string }) {
  const { report, title } = props;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        <p className="mt-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
          Full DR.BRAIN ticketing, investor demo visuals, and the Day&nbsp;1 playbook live under Syria / Darlink (
          <code className="font-mono text-xs">apps/syria</code>
          ). See <code className="font-mono text-xs">docs/day-1-production-monitoring-playbook.md</code>.
        </p>
        <p className="text-sm text-stone-600">
          Overall status:{" "}
          <span
            className={
              report.status === "CRITICAL"
                ? "font-semibold text-red-700"
                : report.status === "WARNING"
                  ? "font-semibold text-amber-800"
                  : "font-semibold text-emerald-800"
            }
          >
            {report.status}
          </span>{" "}
          · Environment: <span className="font-medium">{report.appEnv}</span> ·{" "}
          <span className="text-xs text-stone-500">{report.timestamp}</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-2">Check</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">OK</th>
              <th className="px-4 py-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {report.results.map((r, i) => (
              <tr key={`${r.check}-${i}`} className="border-t border-stone-100 align-top">
                <td className="px-4 py-2 font-mono text-xs text-stone-800">{r.check}</td>
                <td className="px-4 py-2 text-xs">{r.level}</td>
                <td className="px-4 py-2 text-xs">{String(r.ok)}</td>
                <td className="px-4 py-2 text-xs text-stone-700">{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-950">
        <p className="font-semibold">Recommendations</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {report.recommendations.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
