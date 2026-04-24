import type { LaunchMode } from "@/modules/launch-sequencer/launch-sequencer.types";

const styles: Record<LaunchMode, string> = {
  READ_ONLY_INTELLIGENCE: "border-slate-500/50 bg-slate-500/10 text-slate-200",
  BROKER_ASSISTED_PILOT: "border-amber-500/45 bg-amber-500/10 text-amber-100",
  LIMITED_PRODUCTION: "border-sky-500/45 bg-sky-500/10 text-sky-100",
  FULL_PRODUCTION: "border-emerald-500/45 bg-emerald-500/10 text-emerald-100",
};

export function LaunchModeBadge(props: { mode: LaunchMode }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[props.mode]}`}
    >
      {props.mode.replace(/_/g, " ")}
    </span>
  );
}
