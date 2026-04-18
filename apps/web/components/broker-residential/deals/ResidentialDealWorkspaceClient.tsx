"use client";

import { useState } from "react";

export function ResidentialDealWorkspaceClient({
  dealId,
  executionHref,
}: {
  dealId: string;
  executionHref: string;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runCopilot() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/broker/residential/deals/${dealId}/copilot/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(`Analysis complete — ${data.cards?.length ?? 0} cards (review in queue).`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ds-border bg-ds-card/60 p-4 text-sm shadow-ds-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-ds-text-secondary">Actions</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void runCopilot()}
          className="rounded-xl bg-ds-gold/90 px-4 py-2 text-xs font-medium text-black hover:bg-ds-gold disabled:opacity-50"
        >
          {loading ? "Running…" : "Run copilot analysis"}
        </button>
        <a
          href={executionHref}
          className="rounded-xl border border-ds-border px-4 py-2 text-xs font-medium text-ds-gold hover:bg-white/5"
        >
          Full execution workspace
        </a>
      </div>
      {msg && <p className="mt-2 text-xs text-ds-text-secondary">{msg}</p>}
    </div>
  );
}
