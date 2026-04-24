import type { CommandCenterStatusLane } from "@/modules/command-center/command-center.types";

const STYLES: Record<CommandCenterStatusLane, string> = {
  healthy: "border-emerald-500/45 bg-emerald-950/35 text-emerald-100",
  attention: "border-[#D4AF37]/45 bg-[#D4AF37]/10 text-[#f0e6c8]",
  urgent: "border-red-500/50 bg-red-950/40 text-red-100",
  inactive: "border-neutral-700 bg-neutral-900/80 text-neutral-400",
};

const LABELS: Record<CommandCenterStatusLane, string> = {
  healthy: "On track",
  attention: "Watch",
  urgent: "Urgent",
  inactive: "Quiet",
};

export function CcStatusBadge(props: { lane: CommandCenterStatusLane; label?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLES[props.lane]}`}
    >
      {props.label ?? LABELS[props.lane]}
    </span>
  );
}
