"use client";

import type { AiControlCenterRolloutSummary } from "@/modules/control-center/ai-control-center.types";

export function RolloutStateChips({ summary }: { summary: AiControlCenterRolloutSummary }) {
  const blocks: { key: keyof AiControlCenterRolloutSummary; title: string }[] = [
    { key: "primarySystems", title: "Primary" },
    { key: "shadowSystems", title: "Shadow" },
    { key: "influenceSystems", title: "Influence" },
    { key: "blockedSystems", title: "Blocked" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {blocks.map(({ key, title }) => {
        const arr = summary[key];
        return (
          <div key={key} className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-[11px]">
            <span className="text-zinc-500">{title}</span>
            <p className="mt-1 text-zinc-300">{arr.length ? arr.join(", ") : "—"}</p>
          </div>
        );
      })}
    </div>
  );
}
