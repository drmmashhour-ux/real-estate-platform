import type { ExperimentHealth } from "@/modules/playbook-memory/services/playbook-memory-dashboard.service";

export function ExperimentMonitorPanel({ experiment }: { experiment: ExperimentHealth | null }) {
  if (experiment == null) {
    return <p className="text-sm text-white/50">No experiment health loaded.</p>;
  }
  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-[#080808] p-4">
      <p className="text-xs font-semibold uppercase text-[#D4AF37]">Experiment monitor</p>
      <p className="text-sm text-white/80">
        Status: <span className="text-white">{experiment.status}</span>
        {experiment.emergencyFreezes > 0 ? ` · ${experiment.emergencyFreezes} active freeze(s)` : ""}
      </p>
      {experiment.issues.length > 0 ? (
        <ul className="list-inside list-disc text-sm text-amber-100/80">
          {experiment.issues.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-white/45">No open issues in the diagnostic check.</p>
      )}
      {experiment.rollup ? (
        <p className="font-mono text-xs text-white/40">
          Rollup: assignments (sample) {experiment.rollup.assignmentsScanned} · bandit rows {experiment.rollup.banditRowCount}
        </p>
      ) : null}
    </div>
  );
}
