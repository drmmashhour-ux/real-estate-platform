"use client";

import * as React from "react";

import { buildInvestorPitch } from "@/modules/investors/investor-pitch.service";

function CopyButton({ text, label = "Copy slide" }: { text: string; label?: string }) {
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

export function InvestorPitchPanel() {
  const pitch = React.useMemo(() => buildInvestorPitch(), []);
  const fullNarrative = React.useMemo(
    () =>
      pitch.slides
        .map((s) => `${s.title}\n${s.content.join(" ")}`)
        .join("\n\n"),
    [pitch.slides],
  );

  return (
    <section
      className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
      data-investor-pitch-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Investor pitch (V1)</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Narrative deck</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Static, review-only copy — not financial advice. Customize numbers before external use.
          </p>
        </div>
        <CopyButton text={fullNarrative} label="Copy full deck" />
      </div>

      <ol className="mt-4 space-y-4">
        {pitch.slides.map((slide, i) => (
          <li key={slide.title} className="rounded-lg border border-zinc-800/80 bg-black/25 p-3">
            <p className="text-sm font-semibold text-slate-200">
              {i + 1}. {slide.title}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-400">
              {slide.content.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="mt-2">
              <CopyButton text={`${slide.title}\n${slide.content.join("\n")}`} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
