"use client";

import type { GrowthEngineLead } from "@prisma/client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  GROWTH_TEMPLATES,
  type GrowthTemplateKey,
  mailtoLink,
  renderTemplate,
} from "@/lib/growth/templates";
import type { GrowthEngineDashboardMetrics } from "@/lib/growth/metrics";

const PIPELINE_STAGES = ["new", "contacted", "interested", "awaiting_assets", "converted"] as const;
type PipelineStage = (typeof PIPELINE_STAGES)[number];

const STAGE_LABEL: Record<PipelineStage, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  awaiting_assets: "Awaiting assets",
  converted: "Converted",
};

export type SerializedGrowthLead = Omit<
  GrowthEngineLead,
  "createdAt" | "updatedAt" | "lastContactAt" | "consentAt" | "archivedAt"
> & {
  createdAt: string;
  updatedAt: string;
  lastContactAt: string | null;
  consentAt: string | null;
  archivedAt: string | null;
};

type LeadRow = SerializedGrowthLead;

type Props = {
  initialLeads: SerializedGrowthLead[];
  metrics: GrowthEngineDashboardMetrics;
};

function defaultTemplateForRole(role: string): GrowthTemplateKey {
  switch (role) {
    case "owner":
      return "owner_invite";
    case "broker":
      return "broker_pitch";
    case "host":
      return "host_bnhub";
    default:
      return "buyer_early_access";
  }
}

export function GrowthPipelineClient({ initialLeads, metrics }: Props) {
  const [leads, setLeads] = useState<LeadRow[]>(initialLeads);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [templateByLead, setTemplateByLead] = useState<Record<string, GrowthTemplateKey>>({});
  const [csvText, setCsvText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function tplFor(lead: LeadRow): GrowthTemplateKey {
    return templateByLead[lead.id] ?? defaultTemplateForRole(lead.role);
  }

  const byColumn = useMemo(() => {
    const m = new Map<PipelineStage, LeadRow[]>();
    for (const s of PIPELINE_STAGES) m.set(s, []);
    for (const l of leads) {
      if (l.archivedAt) continue;
      const st = l.stage as PipelineStage;
      if (m.has(st)) m.get(st)!.push(l);
    }
    return m;
  }, [leads]);

  async function refresh() {
    const res = await fetch("/api/admin/growth-engine/leads", { cache: "no-store" });
    const data = (await res.json()) as { leads?: LeadRow[] };
    if (data.leads) setLeads(data.leads as LeadRow[]);
  }

  async function patchLead(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/growth-engine/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function quickAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const role = String(fd.get("role") || "buyer");
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim() || null;
    const source = String(fd.get("source") || "manual");
    const permissionStatus = String(fd.get("permissionStatus") || "requested");
    if (!name) return;
    setBusyId("new");
    try {
      const res = await fetch("/api/admin/growth-engine/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name,
          email,
          source,
          permissionStatus,
          notes: String(fd.get("notes") || "").trim() || null,
        }),
      });
      if (res.ok) {
        e.currentTarget.reset();
        await refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function importCsv(e: React.FormEvent) {
    e.preventDefault();
    setImportMsg(null);
    setBusyId("csv");
    try {
      const res = await fetch("/api/admin/growth-engine/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const data = (await res.json()) as { ok?: boolean; created?: number; parseErrors?: string[] };
      if (res.ok && data.ok) {
        setImportMsg(`Imported ${data.created} rows.`);
        setCsvText("");
        await refresh();
      } else {
        setImportMsg(data.parseErrors?.join(" ") ?? "Import failed.");
      }
    } finally {
      setBusyId(null);
    }
  }

  function copyTemplate(lead: LeadRow, key: GrowthTemplateKey) {
    const { subject, body } = renderTemplate(key, { name: lead.name, city: lead.city });
    void navigator.clipboard.writeText(`${subject}\n\n${body}`);
  }

  function openMailto(lead: LeadRow, key: GrowthTemplateKey) {
    const { subject, body } = renderTemplate(key, { name: lead.name, city: lead.city });
    const href = mailtoLink(lead.email ?? undefined, subject, body);
    window.open(href, "_blank");
  }

  function currentNotes(lead: LeadRow): string | null {
    const d = noteDraft[lead.id];
    if (d !== undefined) return d || null;
    return lead.notes ?? null;
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="New leads today" value={String(metrics.leadsCreatedToday)} />
        <MetricCard label="Conversion rate" value={`${metrics.conversionRate}%`} />
        <MetricCard label="Top city" value={metrics.topCity ?? "—"} />
        <MetricCard label="Top source" value={metrics.topSource ?? "—"} />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-200">Quick add (~10s)</h2>
        <form onSubmit={quickAdd} className="mt-3 flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-col gap-1 text-slate-400">
            Name
            <input name="name" required className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100" />
          </label>
          <label className="flex flex-col gap-1 text-slate-400">
            Email
            <input name="email" type="email" className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100" />
          </label>
          <label className="flex flex-col gap-1 text-slate-400">
            Role
            <select name="role" className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100">
              <option value="buyer">Buyer</option>
              <option value="owner">Owner</option>
              <option value="broker">Broker</option>
              <option value="host">Host</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-slate-400">
            Source
            <select name="source" className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100">
              <option value="manual">Manual</option>
              <option value="referral">Referral</option>
              <option value="form">Form</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-slate-400">
            Permission
            <select name="permissionStatus" className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100">
              <option value="requested">Requested</option>
              <option value="granted">Granted</option>
              <option value="unknown">Unknown</option>
              <option value="granted_by_source">Granted by source</option>
            </select>
          </label>
          <label className="flex min-w-[200px] flex-col gap-1 text-slate-400">
            Notes (e.g. FB group)
            <input name="notes" className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100" />
          </label>
          <button
            type="submit"
            disabled={busyId === "new"}
            className="rounded bg-amber-500/90 px-4 py-2 font-medium text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            Add lead
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-200">CSV import (consented lists)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Columns: name, email, phone, city, type (owner|broker|buyer|host). Defaults to permission{" "}
          <code className="text-slate-400">granted_by_source</code>.
        </p>
        <form onSubmit={importCsv} className="mt-3 space-y-2">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={5}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200"
            placeholder={`Ada Lo,ad@x.com,,Montreal,buyer`}
          />
          {importMsg ? <p className="text-sm text-emerald-400">{importMsg}</p> : null}
          <button
            type="submit"
            disabled={busyId === "csv" || !csvText.trim()}
            className="rounded border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            Import
          </button>
        </form>
      </section>

      <section className="overflow-x-auto pb-4">
        <div className="flex min-w-[900px] gap-3">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage} className="w-64 shrink-0 rounded-lg border border-slate-800 bg-slate-950/60">
              <div className="border-b border-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {STAGE_LABEL[stage]} ({byColumn.get(stage)?.length ?? 0})
              </div>
              <div className="max-h-[70vh] space-y-2 overflow-y-auto p-2">
                {(byColumn.get(stage) ?? []).map((lead) => (
                  <article
                    key={lead.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-xs text-slate-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-100">{lead.name ?? lead.email ?? "—"}</p>
                        <p className="text-[10px] text-slate-500">
                          {lead.role} · {lead.source}
                        </p>
                        {lead.city ? <p className="text-slate-500">{lead.city}</p> : null}
                      </div>
                      {lead.needsFollowUp ? (
                        <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
                          Follow-up
                        </span>
                      ) : null}
                    </div>
                    {lead.email ? (
                      <p className="mt-1 truncate text-[11px] text-slate-400">{lead.email}</p>
                    ) : null}

                    <label className="mt-2 block text-[10px] text-slate-500">
                      Notes
                      <textarea
                        value={noteDraft[lead.id] ?? lead.notes ?? ""}
                        onChange={(e) => setNoteDraft((d) => ({ ...d, [lead.id]: e.target.value }))}
                        rows={2}
                        className="mt-0.5 w-full rounded border border-slate-800 bg-slate-950 px-1.5 py-1 text-slate-200"
                      />
                    </label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="rounded bg-slate-800 px-2 py-0.5 text-[10px] hover:bg-slate-700"
                        disabled={busyId === lead.id}
                        onClick={() =>
                          patchLead(lead.id, {
                            notes: currentNotes(lead),
                            stage: "contacted",
                          })
                        }
                      >
                        Contacted
                      </button>
                      <button
                        type="button"
                        className="rounded bg-slate-800 px-2 py-0.5 text-[10px] hover:bg-slate-700"
                        disabled={busyId === lead.id}
                        onClick={() =>
                          patchLead(lead.id, {
                            notes: currentNotes(lead),
                            stage: "interested",
                          })
                        }
                      >
                        Interested
                      </button>
                      <button
                        type="button"
                        className="rounded bg-slate-800 px-2 py-0.5 text-[10px] hover:bg-slate-700"
                        disabled={busyId === lead.id}
                        onClick={() =>
                          patchLead(lead.id, {
                            notes: currentNotes(lead),
                            stage: "awaiting_assets",
                          })
                        }
                      >
                        Awaiting assets
                      </button>
                      <button
                        type="button"
                        className="rounded bg-slate-800 px-2 py-0.5 text-[10px] hover:bg-slate-700"
                        disabled={busyId === lead.id}
                        onClick={() =>
                          patchLead(lead.id, {
                            notes: currentNotes(lead),
                            stage: "converted",
                          })
                        }
                      >
                        Converted
                      </button>
                      <button
                        type="button"
                        className="rounded bg-slate-800 px-2 py-0.5 text-[10px] hover:bg-slate-700"
                        disabled={busyId === lead.id}
                        onClick={() => patchLead(lead.id, { archived: true })}
                      >
                        Archive
                      </button>
                    </div>

                    <div className="mt-2 space-y-1 border-t border-slate-800 pt-2">
                      <p className="text-[10px] font-medium text-slate-500">Templates</p>
                      <select
                        className="w-full rounded border border-slate-800 bg-slate-950 px-1 py-0.5 text-[10px]"
                        value={tplFor(lead)}
                        onChange={(e) => {
                          const k = e.target.value as GrowthTemplateKey;
                          setTemplateByLead((m) => ({ ...m, [lead.id]: k }));
                        }}
                      >
                        {GROWTH_TEMPLATES.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300"
                          onClick={() => copyTemplate(lead, tplFor(lead))}
                        >
                          Copy message
                        </button>
                        <button
                          type="button"
                          className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300"
                          onClick={() => openMailto(lead, tplFor(lead))}
                        >
                          Open email
                        </button>
                        <button
                          type="button"
                          className="rounded border border-emerald-800/60 px-2 py-0.5 text-[10px] text-emerald-300"
                          disabled={busyId === lead.id || !lead.email}
                          onClick={() =>
                            patchLead(lead.id, {
                              markSent: true,
                              lastTemplateKey: tplFor(lead),
                              notes: currentNotes(lead),
                            })
                          }
                        >
                          Mark sent
                        </button>
                      </div>
                    </div>

                    {lead.listingAcquisitionLeadId ? (
                      <Link
                        href={`/admin/listing-acquisition`}
                        className="mt-2 inline-block text-[10px] text-sky-400 hover:underline"
                      >
                        Open acquisition → {lead.listingAcquisitionLeadId.slice(0, 8)}…
                      </Link>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
        <h2 className="text-sm font-semibold text-amber-200/90">Needs follow-up</h2>
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          {leads
            .filter((l) => l.needsFollowUp && !l.archivedAt)
            .map((l) => (
              <li key={l.id}>
                {l.name ?? l.email} — {l.followUpReason ?? "Review"}
              </li>
            ))}
          {leads.every((l) => !l.needsFollowUp || l.archivedAt) ? (
            <li className="text-slate-600">None flagged.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
