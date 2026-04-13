"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import type { LegalDraftWorkspacePayload } from "@/lib/forms/load-draft-workspace";

type DraftPayload = LegalDraftWorkspacePayload;

const SEVERITY_STYLE: Record<string, string> = {
  blocking: "border-red-500/50 bg-red-500/10 text-red-100",
  high: "border-amber-500/40 bg-amber-500/10 text-amber-50",
  warning: "border-yellow-500/35 bg-yellow-500/5 text-yellow-50",
  info: "border-sky-500/30 bg-sky-500/5 text-sky-50",
};

function fieldValuesToEditMap(fv: Record<string, unknown>): Record<string, string> {
  const fe: Record<string, string> = {};
  for (const k of Object.keys(fv)) {
    fe[k] = fv[k] == null ? "" : String(fv[k]);
  }
  return fe;
}

export function LegalFormWorkspaceClient({
  draftId,
  initialDraft,
}: {
  draftId: string;
  initialDraft: DraftPayload;
}) {
  const [draft, setDraft] = useState<DraftPayload>(initialDraft);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldEdit, setFieldEdit] = useState<Record<string, string>>(() =>
    fieldValuesToEditMap(initialDraft.fieldValuesJson as Record<string, unknown>)
  );
  const [confirmExport, setConfirmExport] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    const res = await fetch(`/api/legal-drafting/drafts/${draftId}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load");
    } else {
      setDraft(data.draft);
      setFieldEdit(fieldValuesToEditMap(data.draft.fieldValuesJson as Record<string, unknown>));
    }
    setRefreshing(false);
  }, [draftId]);

  const sections = useMemo(() => {
    const schema = draft?.template.schemaJson as { sections?: { id: string; title: string; fields: { id: string; label: string; type: string }[] }[] };
    return schema?.sections ?? [];
  }, [draft]);

  const runAction = async (path: string, body?: object) => {
    setError(null);
    const res = await fetch(`/api/legal-drafting/drafts/${draftId}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Request failed");
      return;
    }
    await load();
    return data;
  };

  const saveFields = async () => {
    const fieldValues: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fieldEdit)) {
      if (v === "") continue;
      const n = Number(v);
      if (!Number.isNaN(n) && v.trim() !== "" && /^-?\d+(\.\d+)?$/.test(v.trim())) {
        fieldValues[k] = n;
      } else if (v === "true" || v === "false") {
        fieldValues[k] = v === "true";
      } else {
        fieldValues[k] = v;
      }
    }
    await runAction("/fields", { fieldValues });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr_320px]">
      <nav className="space-y-1 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sections</p>
        {sections.map((s) => (
          <a key={s.id} href={`#sec-${s.id}`} className="block rounded-lg px-2 py-1 text-slate-300 hover:bg-slate-800">
            {s.title}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-white">{draft.template.name}</h2>
            <p className="text-xs text-slate-500">
              Status: <span className="text-amber-200">{draft.status}</span> · AI assistive only — broker approval
              required
              {refreshing ? <span className="ml-2 text-sky-400">· Refreshing…</span> : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runAction("/prefill")}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              AI prefill (platform data)
            </button>
            <button
              type="button"
              onClick={() => runAction("/run-rules")}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              Run rules
            </button>
            <button
              type="button"
              onClick={() => runAction("/suggest-clauses")}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              Suggest clauses
            </button>
            <button
              type="button"
              onClick={() => runAction("/summarize")}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              Summarize draft
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
        )}

        {sections.map((sec) => (
          <section key={sec.id} id={`sec-${sec.id}`} className="scroll-mt-24 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <h3 className="text-sm font-semibold text-slate-200">{sec.title}</h3>
            <div className="mt-3 space-y-3">
              {sec.fields.map((f) => (
                <label key={f.id} className="block text-sm">
                  <span className="text-slate-400">{f.label}</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    value={fieldEdit[f.id] ?? ""}
                    onChange={(e) => setFieldEdit((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saveFields()}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900"
          >
            Save fields
          </button>
          <button
            type="button"
            onClick={() => runAction("/review", { action: "mark_ready" })}
            className="rounded-lg border border-emerald-500/40 px-4 py-2 text-sm text-emerald-200"
          >
            Mark ready (if no blocking alerts)
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-white">Export</h3>
          <p className="mt-1 text-xs text-slate-500">
            Broker review required before export. Blocking alerts must be cleared.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={confirmExport} onChange={(e) => setConfirmExport(e.target.checked)} />I have
            reviewed this draft before export
          </label>
          <button
            type="button"
            disabled={!confirmExport}
            onClick={() => runAction("/export", { confirmReviewed: true })}
            className="mt-3 rounded-lg border border-amber-500/50 px-4 py-2 text-sm text-amber-200 disabled:opacity-40"
          >
            Export HTML preview
          </button>
        </div>
      </div>

      <aside className="space-y-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Alerts</p>
          <ul className="mt-2 space-y-2">
            {draft.alerts.map((a) => (
              <li key={a.id} className={`rounded-lg border px-3 py-2 text-xs ${SEVERITY_STYLE[a.severity] ?? SEVERITY_STYLE.info}`}>
                <p className="font-medium">{a.title}</p>
                <p className="mt-1 opacity-90">{a.body}</p>
                {a.sourceType && (
                  <p className="mt-1 text-[10px] opacity-70">
                    Source: {a.sourceType}
                    {a.sourceRef ? ` · ${a.sourceRef}` : ""}
                  </p>
                )}
              </li>
            ))}
            {draft.alerts.length === 0 && <li className="text-slate-600">No alerts stored.</li>}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">AI suggestions</p>
          <ul className="mt-2 space-y-2 text-xs text-slate-300">
            {draft.suggestions.map((s) => (
              <li key={s.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-2">
                <p className="text-[10px] uppercase text-slate-500">{s.suggestionType}</p>
                <p className="mt-1 whitespace-pre-wrap">{s.suggestedValue}</p>
                {s.explanation && <p className="mt-1 text-slate-500">{s.explanation}</p>}
                {s.sourceType && (
                  <p className="mt-1 text-[10px] text-slate-600">
                    {s.sourceType}
                    {s.sourceRef ? ` · ${s.sourceRef}` : ""}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
        {draft.aiSummary && (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Draft summary</p>
            <p className="mt-2 whitespace-pre-wrap text-xs text-slate-300">{draft.aiSummary}</p>
          </div>
        )}
        <Link href="/dashboard/forms" className="inline-block text-xs text-amber-400 hover:text-amber-300">
          ← Back to forms
        </Link>
      </aside>
    </div>
  );
}
