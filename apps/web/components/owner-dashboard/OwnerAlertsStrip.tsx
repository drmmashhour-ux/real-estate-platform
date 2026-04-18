import type { OwnerAlert } from "@/modules/owner-dashboard/owner-dashboard.types";

export function OwnerAlertsStrip({ alerts }: { alerts: OwnerAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`rounded-lg border px-4 py-2 text-sm ${
            a.level === "critical"
              ? "border-red-900/50 bg-red-950/30 text-red-100/90"
              : a.level === "warning"
                ? "border-amber-800/50 bg-amber-950/40 text-amber-100/90"
                : "border-zinc-700 bg-black/40 text-zinc-300"
          }`}
        >
          <span className="font-medium">{a.title}</span>
          <p className="mt-1 text-xs text-zinc-400">{a.detail}</p>
        </div>
      ))}
    </div>
  );
}
