"use client";

import { useCallback, useEffect, useState } from "react";

type PlaybookPayload = {
  playbookName: string;
  playbookKey: string;
  executionStatus: string;
  currentStep: number;
  stepCount: number;
  stage: string | null;
  recommendedAction: string;
  messageTemplate: string;
  bestMessage: string;
  nextStepPreview: { stepOrder: number; stage: string; recommendedAction: string } | null;
};

export function PlaybookConversionStrip({ leadId }: { leadId: string }) {
  const [data, setData] = useState<PlaybookPayload | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    setReady(false);
    const res = await fetch(`/api/lecipm/leads/${leadId}/playbook?compose=1`, { credentials: "same-origin" });
    if (res.ok) {
      setData(await res.json());
    } else {
      setData(null);
    }
    setReady(true);
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!ready) {
    return (
      <div className="mb-4 rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-xs text-[#9CA3AF]">
        Loading conversion playbook…
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/90">Conversion playbook</p>
        <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[10px] text-[#B3B3B3]">
          Step {data.currentStep}/{data.stepCount} · {data.executionStatus}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-white">{data.playbookName}</p>
      <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
        Stage: <span className="font-mono text-emerald-200/90">{data.stage ?? "—"}</span>
        {data.nextStepPreview ? (
          <>
            {" "}
            · Next:{" "}
            <span className="font-mono text-[#B3B3B3]">
              {data.nextStepPreview.stage} ({data.nextStepPreview.recommendedAction})
            </span>
          </>
        ) : null}
      </p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-400/90">Next action</p>
      <p className="text-sm text-white">{data.recommendedAction}</p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-400/90">Suggested message</p>
      <p className="text-sm leading-relaxed text-[#E5E7EB]">{data.messageTemplate}</p>
      {data.bestMessage !== data.messageTemplate ? (
        <>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-amber-300/90">
            Best message (playbook + deal assistant)
          </p>
          <p className="text-sm leading-relaxed text-amber-100/95">{data.bestMessage}</p>
        </>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2">
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(data.bestMessage)}
          className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10"
        >
          Copy best message
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] text-[#B3B3B3] hover:bg-white/5"
        >
          Refresh
        </button>
      </div>
      <p className="mt-2 text-[10px] font-medium tracking-wide text-emerald-500/80">LECIPM PLAYBOOK ENGINE ACTIVE</p>
    </div>
  );
}
