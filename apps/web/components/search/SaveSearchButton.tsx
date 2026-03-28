"use client";

import { useState } from "react";
import { useSearchEngineContext } from "@/components/search/SearchEngine";

export function SaveSearchButton({ tone = "gold" }: { tone?: "gold" | "slate" | "light" }) {
  const { mode, draft } = useSearchEngineContext();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSave = async () => {
    const name = window.prompt("Name this search (e.g. “Downtown condos under $800k”)");
    if (name == null) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setMsg("Name required");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/search/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: trimmed.slice(0, 120),
          mode,
          filtersJson: draft,
        }),
      });
      if (res.status === 401) {
        setMsg("Sign in to save searches");
        return;
      }
      if (!res.ok) {
        setMsg("Could not save");
        return;
      }
      setMsg("Saved");
      window.setTimeout(() => setMsg(null), 2500);
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  };

  const gold =
    "rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-premium-gold/45 hover:text-white disabled:opacity-50";
  const slate =
    "rounded-xl border border-slate-600 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500/40 hover:text-white disabled:opacity-50";
  const light =
    "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-premium-gold/50 hover:bg-white disabled:opacity-50";

  const btnClass = tone === "slate" ? slate : tone === "light" ? light : gold;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button type="button" onClick={() => void onSave()} disabled={busy} className={btnClass}>
        {busy ? "Saving…" : "Save search"}
      </button>
      {msg ? <span className="text-[10px] text-slate-500">{msg}</span> : null}
    </div>
  );
}
