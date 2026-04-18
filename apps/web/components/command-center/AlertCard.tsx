import type { CommandCenterAlert } from "@/modules/alerts/alert.types";
import type { AnomalyFlag } from "@/modules/market-intelligence/market-intelligence.types";

export function AlertCard({
  alerts,
  anomalies,
}: {
  alerts: CommandCenterAlert[];
  anomalies: AnomalyFlag[];
}) {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 shadow-ds-soft">
      <h2 className="text-sm font-semibold text-amber-100">Alerts &amp; anomalies</h2>
      <p className="mt-1 text-xs text-amber-200/70">
        Alerts = rule engine on KPI deltas; anomalies = metric-shape checks vs prior window (same length).
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        {alerts.map((a) => (
          <li key={a.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase text-amber-400/90">{a.severity}</span>
            <p className="text-ds-text">{a.body}</p>
          </li>
        ))}
        {anomalies.map((x) => (
          <li key={x.code} className="rounded-lg border border-amber-900/40 bg-black/20 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase text-amber-300/90">{x.severity}</span>
            <p className="font-mono text-[10px] text-ds-text-secondary/90">{x.code}</p>
            <p className="mt-1 text-ds-text">{x.message}</p>
          </li>
        ))}
        {anomalies.length === 0 && alerts.length === 0 ? (
          <li className="text-ds-text-secondary">No alerts or anomaly flags in this window.</li>
        ) : null}
      </ul>
    </div>
  );
}
