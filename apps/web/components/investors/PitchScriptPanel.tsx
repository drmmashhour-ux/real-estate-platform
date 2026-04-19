"use client";

import * as React from "react";

import { getInvestorPitchScripts } from "@/modules/investors/pitch-script.service";

function CopyBtn({
  text,
  label,
  onCopied,
}: {
  text: string;
  label: string;
  onCopied?: () => void;
}) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      className="rounded-md border border-zinc-600 bg-zinc-800/80 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          onCopied?.();
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

type PitchScriptPanelProps = {
  executionAccountabilitySync?: boolean;
  viewerUserId?: string;
};

export function PitchScriptPanel({
  executionAccountabilitySync,
  viewerUserId,
}: PitchScriptPanelProps = {}) {
  const scripts = React.useMemo(() => getInvestorPitchScripts(), []);
  const sixty = scripts.find((s) => s.type === "60_sec");
  const five = scripts.find((s) => s.type === "5_min");

  return (
    <section
      className="rounded-xl border border-indigo-900/45 bg-indigo-950/15 p-4"
      data-growth-pitch-script-v1
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-300/90">Investor pitch scripts</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">60 sec + 5 min</h3>
        <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
          Practice out loud; paste manually when needed. Nothing is sent from this panel.
        </p>
      </div>

      {sixty ? (
        <div className="mt-4 rounded-lg border border-zinc-800/80 bg-black/25 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-200">60-second script</p>
            <CopyBtn text={sixty.script} label="Copy" />
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-400">{sixty.script}</pre>
        </div>
      ) : null}

      {five ? (
        <div className="mt-4 rounded-lg border border-zinc-800/80 bg-black/25 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-200">5-minute script</p>
            <CopyBtn
              text={five.script}
              label="Copy"
              onCopied={
                executionAccountabilitySync && viewerUserId
                  ? () => {
                      void fetch("/api/growth/execution-accountability", {
                        method: "POST",
                        credentials: "same-origin",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "pitch_copy", pitchVariant: "5_min" }),
                      }).catch(() => {});
                    }
                  : undefined
              }
            />
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-400">{five.script}</pre>
        </div>
      ) : null}
    </section>
  );
}
