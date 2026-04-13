"use client";

function badge(sev: string): string {
  if (sev === "critical") return "bg-red-950/60 text-red-200 border-red-800";
  if (sev === "warning") return "bg-amber-950/50 text-amber-200 border-amber-800";
  return "bg-zinc-900 text-zinc-300 border-zinc-700";
}

export type DriftAlertRow = {
  id: string;
  severity: string;
  alertType: string;
  message: string;
  segmentKey?: string | null;
  createdAt: string;
};

export function DriftAlertsPanel({ alerts }: { alerts: DriftAlertRow[] }) {
  if (!alerts.length) {
    return <p className="text-sm text-zinc-500">No drift alerts loaded.</p>;
  }

  return (
    <ul className="space-y-2">
      {alerts.map((a) => (
        <li key={a.id} className={`rounded-lg border px-3 py-2 text-sm ${badge(a.severity)}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wide opacity-90">{a.alertType}</span>
            <span className="text-[10px] opacity-70">{new Date(a.createdAt).toLocaleString()}</span>
          </div>
          <p className="mt-1 leading-relaxed">{a.message}</p>
          {a.segmentKey ? <p className="mt-1 font-mono text-[10px] opacity-80">segment: {a.segmentKey}</p> : null}
        </li>
      ))}
    </ul>
  );
}
