"use client";

import type { AiControlCenterPayload } from "../ai-control-center.types";

function ChipList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="text-xs text-zinc-600">—</span>
        ) : (
          items.map((x) => (
            <span key={x} className="rounded-full border border-zinc-700 bg-zinc-900/60 px-2 py-0.5 text-[11px] text-zinc-300">
              {x}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

export function AiRolloutSummaryBlock({ payload }: { payload: AiControlCenterPayload }) {
  const r = payload.rolloutSummary;
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Rollout posture (flags)</h2>
      <p className="mt-1 text-xs text-zinc-600">Primary / shadow / influence reflect env flags — not live mutations.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChipList label="Primary" items={r.primarySystems} />
        <ChipList label="Shadow" items={r.shadowSystems} />
        <ChipList label="Influence" items={r.influenceSystems} />
        <ChipList label="Blocked / backlog" items={r.blockedSystems} />
      </div>
    </section>
  );
}
