"use client";

import { useCallback, useState } from "react";

export type VariantRow = {
  label: string;
  variantKey: string;
  text: string;
  uses: number;
  replies: number;
  performanceScore: number | null;
};

export function ScriptVariantsPanel({
  variants,
  messagesTask,
  onIncrementMessage,
  onRefresh,
}: {
  variants: VariantRow[];
  messagesTask: { completedCount: number; targetCount: number } | null;
  onIncrementMessage: () => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const postVariant = useCallback(
    async (variant: string, event: "use" | "reply") => {
      setBusyKey(`${variant}:${event}`);
      try {
        const res = await fetch("/api/daily-execution/metrics/variant", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variant, event }),
        });
        if (!res.ok) return;
        await onRefresh();
      } finally {
        setBusyKey(null);
      }
    },
    [onRefresh]
  );

  const copy = useCallback((text: string) => {
    void navigator.clipboard.writeText(text);
  }, []);

  const done = messagesTask?.completedCount ?? 0;
  const target = messagesTask?.targetCount ?? 20;
  const [msgBusy, setMsgBusy] = useState(false);

  async function logMessageSent() {
    setMsgBusy(true);
    try {
      await onIncrementMessage();
      await onRefresh();
    } finally {
      setMsgBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5 text-slate-100">
      <h2 className="text-lg font-semibold">DM scripts (A / B / C)</h2>
      <p className="mt-1 text-xs text-slate-500">
        Copy and send yourself. “Mark use” tracks which script you ran; “Reply” logs a reply tied to that variant (+1 reply
        total).
      </p>
      <p className="mt-2 text-sm text-slate-400">
        Messages logged today: <span className="font-medium text-emerald-400">{done}</span> / {target}
      </p>
      <div className="mt-4 space-y-4">
        {variants.map((v) => (
          <div key={v.variantKey} className="rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-premium-gold">
                Variant {v.label}{" "}
                <span className="font-normal text-slate-500">({v.variantKey.replace(/_/g, " ")})</span>
              </span>
              <span className="text-xs text-slate-500">
                uses {v.uses} · replies {v.replies}
                {v.performanceScore != null ? ` · score ${v.performanceScore.toFixed(2)}` : ""}
              </span>
            </div>
            <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap text-xs text-slate-300">{v.text}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy(v.text)}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/10"
              >
                Copy
              </button>
              <button
                type="button"
                disabled={busyKey !== null}
                onClick={() => void postVariant(v.variantKey, "use")}
                className="rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100 hover:bg-violet-500/20 disabled:opacity-40"
              >
                {busyKey === `${v.variantKey}:use` ? "…" : "Mark use"}
              </button>
              <button
                type="button"
                disabled={busyKey !== null}
                onClick={() => void postVariant(v.variantKey, "reply")}
                className="rounded-md border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
              >
                {busyKey === `${v.variantKey}:reply` ? "…" : "Got reply (this script)"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={msgBusy || done >= target}
        onClick={() => void logMessageSent()}
        className="mt-4 rounded-md bg-emerald-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
      >
        {msgBusy ? "Saving…" : "+1 message sent (today)"}
      </button>
    </section>
  );
}
