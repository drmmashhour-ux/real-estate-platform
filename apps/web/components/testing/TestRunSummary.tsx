import type { UnifiedPlatformSimulationReport } from "@/modules/e2e-simulation/e2e-simulation.types";

type Props = { report: UnifiedPlatformSimulationReport };

export function TestRunSummary({ report }: Props) {
  const pass = report.scenarios.filter((s) => s.status === "PASS").length;
  const fail = report.scenarios.filter((s) => s.status === "FAIL").length;
  const warn = report.scenarios.filter((s) => s.status === "WARNING").length;
  const nc = report.scenarios.filter((s) => s.status === "NOT_CONFIRMED").length;

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Stat label="Scenarios" value={String(report.scenarios.length)} />
      <Stat label="PASS" value={String(pass)} tone="emerald" />
      <Stat label="FAIL" value={String(fail)} tone="red" />
      <Stat label="WARN / NC" value={`${warn} / ${nc}`} tone="amber" />
    </div>
  );
}

function Stat(props: { label: string; value: string; tone?: "emerald" | "red" | "amber" }) {
  const c =
    props.tone === "emerald"
      ? "border-emerald-500/30 text-emerald-400"
      : props.tone === "red"
        ? "border-red-500/30 text-red-400"
        : props.tone === "amber"
          ? "border-amber-500/30 text-amber-400"
          : "border-zinc-700 text-zinc-300";
  return (
    <div className={`rounded-xl border bg-zinc-950/50 px-3 py-2 ${c}`}>
      <div className="text-xs uppercase tracking-wide text-zinc-500">{props.label}</div>
      <div className="text-xl font-semibold">{props.value}</div>
    </div>
  );
}
