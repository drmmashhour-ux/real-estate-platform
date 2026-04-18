"use client";

import type { HubJourneyPlan, HubJourneyStepStatus } from "@/modules/journey/hub-journey.types";

const statusLabel: Record<HubJourneyStepStatus, string> = {
  locked: "Locked",
  available: "Up next",
  in_progress: "Current",
  completed: "Done",
  blocked: "Blocked",
};

function statusClass(s: HubJourneyStepStatus): string {
  switch (s) {
    case "completed":
      return "border-amber-500/40 bg-amber-500/10 text-amber-100";
    case "in_progress":
      return "border-amber-400 bg-amber-500/15 text-amber-50 ring-1 ring-amber-400/40";
    case "blocked":
      return "border-red-500/40 bg-red-950/40 text-red-100";
    case "locked":
      return "border-white/10 bg-black/40 text-zinc-500";
    default:
      return "border-white/10 bg-zinc-900/60 text-zinc-300";
  }
}

export function HubJourneyStepper({ plan }: { plan: HubJourneyPlan | null }) {
  if (!plan) return null;
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-full gap-2 md:flex-wrap">
        {plan.steps.map((step) => (
          <li
            key={step.id}
            className={`flex min-w-[140px] flex-1 flex-col rounded-lg border px-3 py-2 text-xs ${statusClass(step.status)}`}
          >
            <span className="font-medium text-[10px] uppercase tracking-wide text-zinc-400">
              {step.order}. {statusLabel[step.status]}
            </span>
            <span className="mt-1 line-clamp-2 text-[13px] leading-snug">{step.title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
