import type { ExperimentHealth, PlaybookMemoryOverview } from "@/modules/playbook-memory/services/playbook-memory-dashboard.service";

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-amber-600/20 bg-[#0b0b0b] p-4 text-white/90">
      <p className="text-xs uppercase tracking-wider text-[#D4AF37]/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-white/40">{sub}</p> : null}
    </div>
  );
}

function fmtN(n: number | null | undefined, p = 2) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n <= 1 && n >= 0) return n.toFixed(p);
  return String(Math.round(n));
}

export function PlaybookSummaryCards({ overview, experiment }: { overview: PlaybookMemoryOverview; experiment: ExperimentHealth | null }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Total playbooks" value={String(overview.totalPlaybooks)} />
      <Card label="Active" value={String(overview.activePlaybooks)} />
      <Card label="Paused" value={String(overview.pausedPlaybooks)} />
      <Card label="Assignments (7d)" value={String(overview.assignments7d)} />
      <Card
        label="Success rate (7d)"
        value={fmtN(overview.successRate7d)}
        sub={overview.successRate7d != null ? "SUCCEEDED vs FAILED in window" : undefined}
      />
      <Card
        label="Avg reward (7d, realized mix)"
        value={fmtN(overview.avgReward7d)}
        sub={overview.avgReward7d != null ? "rough [0,1] blend" : undefined}
      />
      <Card label="Explore rate (7d, recorded)" value={fmtN(overview.exploreRate7d)} sub="from assignment rows" />
      <Card
        label="Experiment health"
        value={experiment?.status ?? "—"}
        sub={experiment?.emergencyFreezes ? `${experiment.emergencyFreezes} global freeze(s)` : undefined}
      />
    </section>
  );
}
