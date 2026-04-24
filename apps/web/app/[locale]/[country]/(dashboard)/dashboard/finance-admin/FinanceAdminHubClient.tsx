"use client";

import * as React from "react";

type TabId = "overview" | "taxes" | "regulatory" | "investment" | "legal";

export function FinanceAdminHubClient() {
  const [tab, setTab] = React.useState<TabId>("overview");
  const [overview, setOverview] = React.useState<unknown>(null);
  const [taxes, setTaxes] = React.useState<unknown>(null);
  const [obligations, setObligations] = React.useState<unknown>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [o, t, ob] = await Promise.all([
        fetch("/api/finance-admin/overview", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/finance-admin/taxes", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/finance-admin/obligations", { credentials: "include" }).then((r) => r.json()),
      ]);
      if (o.error) throw new Error(o.error);
      if (t.error) throw new Error(t.error);
      if (ob.error) throw new Error(ob.error);
      setOverview(o);
      setTaxes(t);
      setObligations(ob);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "taxes", label: "Taxes" },
    { id: "regulatory", label: "Regulatory" },
    { id: "investment", label: "Investment compliance" },
    { id: "legal", label: "Legal pack" },
  ];

  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t.id ? "bg-amber-500/20 text-amber-100" : "text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto text-xs text-slate-500 hover:text-slate-300"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
      {err ? <p className="text-sm text-rose-400">{err}</p> : null}

      {!loading && !err && tab === "overview" ? (
        <pre className="max-h-[70vh] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-300">
          {JSON.stringify(overview, null, 2)}
        </pre>
      ) : null}

      {!loading && !err && tab === "taxes" ? (
        <pre className="max-h-[70vh] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-300">
          {JSON.stringify(taxes, null, 2)}
        </pre>
      ) : null}

      {!loading && !err && tab === "regulatory" ? (
        <pre className="max-h-[70vh] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-300">
          {JSON.stringify(obligations, null, 2)}
        </pre>
      ) : null}

      {!loading && !err && tab === "investment" ? (
        <div className="space-y-3 text-sm text-slate-400">
          <p>
            SPV tools: use{" "}
            <code className="text-slate-300">GET /api/investment-compliance/spv/[id]</code> and related POST routes
            (choose exemption, generate legal pack, mark Form 45-106F1 filed). Sponsor or admin only.
          </p>
          <p>
            Default mode remains <strong className="text-slate-200">private exempt deal</strong> — no public offering
            workflow.
          </p>
          <pre className="max-h-[40vh] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-300">
            {JSON.stringify((overview as { spvs?: unknown })?.spvs ?? [], null, 2)}
          </pre>
        </div>
      ) : null}

      {!loading && !err && tab === "legal" ? (
        <div className="space-y-3 text-sm text-slate-400">
          <p>
            Generate packs via{" "}
            <code className="text-slate-300">POST /api/investment-compliance/spv/[id]/generate-legal-pack</code> after
            selecting an exemption. Documents are versioned templates — counsel must review before reliance.
          </p>
          <p className="text-xs text-slate-500">
            No guaranteed returns language is embedded in pack disclaimers; broker conflicts must be completed in the
            subscription agreement section.
          </p>
        </div>
      ) : null}
    </div>
  );
}
