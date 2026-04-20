import type { GlobalExecutionSummary } from "@/modules/global-intelligence/global-intelligence.types";

export function GlobalAutomationCard({ summary }: { summary: GlobalExecutionSummary }) {
  return (
    <div className="rounded-xl border border-violet-900/40 bg-black p-4 text-sm text-zinc-200">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Automation posture</p>
      <ul className="mt-3 space-y-2">
        {summary.regions.map((r) => (
          <li key={r.regionCode} className="border-b border-zinc-900 pb-2">
            <div className="flex justify-between">
              <span>{r.regionCode}</span>
              <span className="text-xs text-zinc-500">
                preview {r.autonomousPreview ? "on" : "off"} · exec {r.controlledExecution ? "on" : "off"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-600">{r.notes.slice(0, 2).join(" · ")}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-600">{summary.freshness}</p>
    </div>
  );
}
