"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BrokerPipelineSummary, BrokerProspect, BrokerStage } from "@/modules/brokers/broker-pipeline.types";
import type { BrokerOutreachScripts } from "@/modules/brokers/broker-outreach.service";
import type { BrokerOutreachScriptMeta } from "@/modules/brokers/broker-outreach.service";
import type { BrokerLeadPreviewPayload } from "@/modules/brokers/broker-lead-preview.service";
import { BrokerLeadPreview } from "@/components/brokers/BrokerLeadPreview";
import { conversionEngineFlags } from "@/config/feature-flags";
import { BrokerQuickAddForm } from "@/components/brokers/BrokerQuickAddForm";

const STAGES: BrokerStage[] = ["new", "contacted", "replied", "demo", "converted", "lost"];

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text).catch(() => {
    window.alert("Could not copy.");
  });
}

function personalize(body: string, prospectName: string): string {
  const first = prospectName.trim().split(/\s+/)[0] ?? prospectName;
  return body.replace(/\[Name\]/g, first);
}

type ApiPayload = {
  prospects: BrokerProspect[];
  summary: BrokerPipelineSummary | null;
  dailyActions: string[];
  monitoring: {
    prospectsAdded: number;
    stageChanges: number;
    notesAdded: number;
    scriptsCopied: number;
    conversionsMarked: number;
    lostDeals: number;
    conversionAttempts: number;
    missingDataWarnings: number;
    conversions: number;
  };
  scripts: BrokerOutreachScripts;
  scriptList: BrokerOutreachScriptMeta[];
  leadPreview: BrokerLeadPreviewPayload | null;
};

export function BrokerPipelineDashboard() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/broker-pipeline-v1", { credentials: "same-origin" });
      const j = (await res.json()) as ApiPayload & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed to load");
      setData({
        prospects: j.prospects ?? [],
        summary: j.summary ?? null,
        dailyActions: j.dailyActions ?? [],
        monitoring: j.monitoring ?? {
          prospectsAdded: 0,
          stageChanges: 0,
          notesAdded: 0,
          scriptsCopied: 0,
          conversionsMarked: 0,
          lostDeals: 0,
          conversionAttempts: 0,
          missingDataWarnings: 0,
          conversions: 0,
        },
        scriptList: j.scriptList ?? [],
        leadPreview: j.leadPreview ?? null,
      });
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const prospects = data?.prospects ?? [];

  const byStage = useMemo(() => {
    const m = new Map<BrokerStage, BrokerProspect[]>();
    for (const s of STAGES) m.set(s, []);
    for (const p of prospects) {
      const list = m.get(p.stage);
      if (list) list.push(p);
    }
    return m;
  }, [prospects]);

  const summary = data?.summary;

  const moveStage = async (id: string, stage: BrokerStage) => {
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stage", id, stage }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      window.alert((j as { error?: string }).error ?? "Update failed");
      return;
    }
    await load();
  };

  const addNote = async (id: string) => {
    const note = window.prompt("Add a note (logged on prospect):");
    if (!note?.trim()) return;
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "note", id, note: note.trim() }),
    });
    if (!res.ok) {
      window.alert("Could not save note");
      return;
    }
    await load();
  };

  const copyScript = async (p: BrokerProspect, meta: BrokerOutreachScriptMeta) => {
    const text = personalize(meta.body, p.name);
    copyToClipboard(text);
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "script_copy", id: p.id, scriptKind: meta.id }),
    });
    if (!res.ok) window.alert("Copied, but could not update contact meta.");
    else await load();
  };

  const markDemoShown = async (p: BrokerProspect) => {
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "demo_shown", id: p.id, shown: true }),
    });
    if (!res.ok) window.alert("Could not update");
    else await load();
  };

  const markPurchase = async (p: BrokerProspect) => {
    const amount = window.prompt("Total spent (CAD dollars, optional), e.g. 49", String(p.totalSpent ?? ""));
    if (amount === null) return;
    const totalSpent = amount.trim() === "" ? undefined : Number.parseFloat(amount);
    if (amount.trim() !== "" && !Number.isFinite(totalSpent)) {
      window.alert("Invalid number");
      return;
    }
    const res = await fetch("/api/admin/broker-pipeline-v1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "mark_purchase",
        id: p.id,
        firstPurchaseDate: new Date().toISOString().slice(0, 10),
        totalSpent,
      }),
    });
    if (!res.ok) window.alert("Could not mark purchase");
    else await load();
  };

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading pipeline…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }

  const daily = data?.dailyActions ?? [];
  const mon = data?.monitoring;
  const scriptList = data?.scriptList ?? [];

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-400">
        In-memory pipeline (optional JSON via <code className="text-slate-300">BROKER_PIPELINE_JSON_PATH</code>). For the
        legacy DB prospect list, use{" "}
        <a href="/admin/broker-acquisition-legacy" className="text-emerald-400 hover:underline">
          broker-acquisition-legacy
        </a>
        .
      </p>

      {daily.length > 0 ? (
        <section className="rounded-xl border border-premium-gold/30 bg-amber-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Today&apos;s actions</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-100/90">
            {daily.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {summary ? (
        <div className="flex flex-wrap gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
          <div>
            <p className="text-[10px] uppercase text-slate-500">Total</p>
            <p className="text-lg font-semibold text-white">{summary.total}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Contacted</p>
            <p className="text-lg font-semibold text-white">{summary.byStage.contacted}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Replied</p>
            <p className="text-lg font-semibold text-white">{summary.byStage.replied}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Converted</p>
            <p className="text-lg font-semibold text-emerald-300">{summary.byStage.converted}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Conversion rate</p>
            <p className="text-lg font-semibold text-white">{summary.conversionRate}%</p>
          </div>
        </div>
      ) : null}

      {mon ? (
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Added: {mon.prospectsAdded}</span>
          <span>Stage moves: {mon.stageChanges}</span>
          <span>Notes: {mon.notesAdded}</span>
          <span>Scripts copied: {mon.scriptsCopied}</span>
          <span>Converted: {mon.conversionsMarked}</span>
          <span>Lost: {mon.lostDeals}</span>
          <span>Unlock attempts: {mon.conversionAttempts}</span>
          <span>Missing contact hints: {mon.missingDataWarnings}</span>
        </div>
      ) : null}

      <BrokerQuickAddForm onAdded={load} />

      <div className="grid gap-4 lg:grid-cols-6">
        {STAGES.map((stage) => (
          <div key={stage} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold capitalize text-premium-gold">{stage}</h3>
              <span className="text-[10px] text-slate-500">{(byStage.get(stage) ?? []).length}</span>
            </div>
            <ul className="mt-2 max-h-[min(480px,55vh)] space-y-2 overflow-y-auto">
              {(byStage.get(stage) ?? []).map((p) => (
                <li key={p.id} className="rounded-lg border border-slate-800/80 bg-black/30 p-2 text-xs text-slate-200">
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {[p.email, p.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {p.agency ? <p className="text-[11px] text-slate-500">{p.agency}</p> : null}
                  <p className="text-[10px] text-slate-500">
                    {p.source ? `${p.source} · ` : ""}
                    notes {p.notes?.length ?? 0} · created {p.createdAt.slice(0, 10)} · upd {p.updatedAt.slice(0, 10)}
                  </p>
                  {p.lastContactAt ? (
                    <p className="text-[10px] text-slate-600">Last outreach: {p.lastContactAt.slice(0, 16)}</p>
                  ) : null}
                  {p.demoLeadPreviewShown ? (
                    <p className="text-[10px] text-amber-200/90">Demo lead preview shown</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <select
                      aria-label={`Move ${p.name}`}
                      className="max-w-full rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-[10px] text-white"
                      value={p.stage}
                      onChange={(e) => void moveStage(p.id, e.target.value as BrokerStage)}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          → {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                      onClick={() => void addNote(p.id)}
                    >
                      Note
                    </button>
                    <button
                      type="button"
                      className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                      onClick={() => void markDemoShown(p)}
                    >
                      Mark demo shown
                    </button>
                    <button
                      type="button"
                      className="rounded border border-emerald-700 px-1.5 py-0.5 text-[10px] text-emerald-300 hover:bg-slate-800"
                      onClick={() => void markPurchase(p)}
                    >
                      Mark purchase
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 border-t border-slate-800/80 pt-2">
                    {scriptList.map((meta) => (
                      <button
                        key={meta.id}
                        type="button"
                        className="rounded border border-slate-700 px-1.5 py-0.5 text-[9px] text-slate-400 hover:bg-slate-800"
                        onClick={() => void copyScript(p, meta)}
                      >
                        Copy {meta.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <BrokerLeadPreview
        conversionBoost={conversionEngineFlags.conversionUpgradeV1}
        leadPreviewPayload={data?.leadPreview ?? undefined}
      />

      {scriptList.length > 0 ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-white">Outreach scripts (global)</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {scriptList.map((meta) => (
              <div key={meta.id} className="rounded-lg border border-slate-800 bg-black/20 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">{meta.label}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs text-slate-300">{meta.body}</p>
                <button
                  type="button"
                  className="mt-2 text-[11px] font-semibold text-emerald-400 hover:underline"
                  onClick={() => copyToClipboard(meta.body)}
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
