"use client";

import { useCallback, useState } from "react";
import { generateDailyDM, regenerateDailyDM } from "@/src/modules/daily-execution/domain/dailyDmScript";

type TaskSlice = { completedCount: number; targetCount: number };

export function OutreachExecutionPanel({
  messagesTask,
  onIncrement,
}: {
  messagesTask: TaskSlice | null;
  onIncrement: () => Promise<void>;
}) {
  const [variant, setVariant] = useState(0);
  const [script, setScript] = useState(() => generateDailyDM({ variantIndex: 0 }).script);
  const [busy, setBusy] = useState(false);

  const copyScript = useCallback(() => {
    void navigator.clipboard.writeText(script);
  }, [script]);

  const regenerate = useCallback(() => {
    const next = regenerateDailyDM(variant);
    setVariant(next.variantIndex);
    setScript(next.script);
  }, [variant]);

  async function messageSent() {
    setBusy(true);
    try {
      await onIncrement();
    } finally {
      setBusy(false);
    }
  }

  const done = messagesTask?.completedCount ?? 0;
  const target = messagesTask?.targetCount ?? 20;

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5 text-slate-100">
      <h2 className="text-lg font-semibold">Outreach (manual send)</h2>
      <p className="mt-1 text-xs text-slate-500">
        Copy the script, send it yourself from your phone or inbox — LECIPM never sends DMs for you.
      </p>
      <p className="mt-3 text-sm text-slate-400">
        Progress: <span className="font-medium text-emerald-400">{done}</span> / {target} logged
      </p>
      <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-slate-200">
        {script}
      </pre>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copyScript()}
          className="rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
        >
          Copy script
        </button>
        <button
          type="button"
          onClick={() => regenerate()}
          className="rounded-md border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 hover:bg-violet-500/20"
        >
          Regenerate
        </button>
        <button
          type="button"
          disabled={busy || done >= target}
          onClick={() => void messageSent()}
          className="rounded-md bg-emerald-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          {busy ? "Saving…" : "Message sent (+1)"}
        </button>
      </div>
    </section>
  );
}
