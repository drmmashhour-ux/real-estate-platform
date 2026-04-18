"use client";

import * as React from "react";

import { buildFundraisingMetrics, buildFundraisingNarrative } from "@/modules/investors/fundraising.service";

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      className="rounded-md border border-zinc-600 bg-zinc-800/80 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          /* ignore */
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

export function FundraisingPanel() {
  const narrative = React.useMemo(() => buildFundraisingNarrative(), []);
  const metrics = React.useMemo(() => buildFundraisingMetrics(), []);

  const fullCopy = React.useMemo(() => {
    const blocks = [
      `Problem\n${narrative.problem}`,
      `Solution\n${narrative.solution}`,
      `Traction\n${narrative.traction}`,
      `Vision\n${narrative.vision}`,
      "\nKey metrics (advisory)",
      ...metrics.map((m) => `${m.name}: ${m.value}`),
    ];
    return blocks.join("\n\n");
  }, [narrative, metrics]);

  return (
    <section
      className="rounded-xl border border-violet-900/45 bg-violet-950/15 p-4"
      data-growth-fundraising-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-300/90">Fundraising engine</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Narrative + metrics</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Review-only copy — not a securities offering. Replace metrics with audited numbers before circulation.
          </p>
        </div>
        <CopyButton text={fullCopy} label="Copy all" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800/80 bg-black/25 p-3">
          <p className="text-xs font-semibold uppercase text-zinc-500">Problem</p>
          <p className="mt-1 text-sm text-zinc-300">{narrative.problem}</p>
          <div className="mt-2">
            <CopyButton text={narrative.problem} label="Copy" />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-black/25 p-3">
          <p className="text-xs font-semibold uppercase text-zinc-500">Solution</p>
          <p className="mt-1 text-sm text-zinc-300">{narrative.solution}</p>
          <div className="mt-2">
            <CopyButton text={narrative.solution} label="Copy" />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-black/25 p-3">
          <p className="text-xs font-semibold uppercase text-zinc-500">Traction</p>
          <p className="mt-1 text-sm text-zinc-300">{narrative.traction}</p>
          <div className="mt-2">
            <CopyButton text={narrative.traction} label="Copy" />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-black/25 p-3">
          <p className="text-xs font-semibold uppercase text-zinc-500">Vision</p>
          <p className="mt-1 text-sm text-zinc-300">{narrative.vision}</p>
          <div className="mt-2">
            <CopyButton text={narrative.vision} label="Copy" />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Key metrics (advisory)</p>
        <ul className="mt-2 space-y-2">
          {metrics.map((m) => (
            <li
              key={m.name}
              className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-zinc-800/60 bg-zinc-900/40 px-3 py-2 text-sm"
            >
              <span className="font-medium text-zinc-200">{m.name}</span>
              <span className="max-w-md text-right text-zinc-400">{m.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
