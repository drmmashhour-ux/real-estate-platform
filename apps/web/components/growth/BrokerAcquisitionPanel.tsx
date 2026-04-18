"use client";

import * as React from "react";
import Link from "next/link";

import type { BrokerAcquisitionLead, BrokerChannel, BrokerScript } from "@/modules/growth/broker-acquisition.types";

type CrmSummary = {
  total: number;
  byStatus: Record<string, number>;
};

const CRM_ORDER = ["new", "contacted", "replied", "demo_scheduled", "converted", "lost"] as const;

const CHANNELS: { id: BrokerChannel; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "direct_call", label: "Direct call" },
];

const EXEC_STATUSES: BrokerAcquisitionLead["status"][] = [
  "not_contacted",
  "contacted",
  "replied",
  "interested",
  "converted",
];

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      className="rounded-md border border-zinc-600 bg-zinc-800/80 px-2 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
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

function replaceCity(msg: string, city: string): string {
  return msg.split("[CITY]").join(city.trim() || "[CITY]");
}

export function BrokerAcquisitionPanel({
  locale,
  country,
  defaultCity = "Montréal",
}: {
  locale: string;
  country: string;
  defaultCity?: string;
}) {
  const [crm, setCrm] = React.useState<CrmSummary | null>(null);
  const [scripts, setScripts] = React.useState<BrokerScript[] | null>(null);
  const [leads, setLeads] = React.useState<BrokerAcquisitionLead[]>([]);
  const [city, setCity] = React.useState(defaultCity);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const [formChannel, setFormChannel] = React.useState<BrokerChannel>("instagram");
  const [formName, setFormName] = React.useState("");
  const [formNotes, setFormNotes] = React.useState("");

  const adminHref = `/${locale}/${country}/admin/brokers-acquisition`;

  const refresh = React.useCallback(() => {
    setLoading(true);
    setErr(null);
    void Promise.all([
      fetch("/api/growth/broker-acquisition", { credentials: "same-origin" }).then(async (r) => {
        const j = (await r.json()) as CrmSummary & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "CRM summary failed");
        return j;
      }),
      fetch("/api/growth/broker-acquisition/scripts", { credentials: "same-origin" }).then(async (r) => {
        const j = (await r.json()) as { scripts?: BrokerScript[]; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Scripts failed");
        return j.scripts ?? [];
      }),
      fetch("/api/growth/broker-acquisition/execution-leads", { credentials: "same-origin" }).then(async (r) => {
        const j = (await r.json()) as { leads?: BrokerAcquisitionLead[]; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Execution list failed");
        return j.leads ?? [];
      }),
    ])
      .then(([c, s, l]) => {
        setCrm({ total: c.total, byStatus: c.byStatus });
        setScripts(s);
        setLeads(l);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const convertedCount = React.useMemo(
    () => leads.filter((l) => l.status === "converted").length,
    [leads],
  );

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/growth/broker-acquisition/execution-leads", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: formChannel,
        name: formName.trim() || undefined,
        notes: formNotes.trim() || undefined,
      }),
    });
    const j = (await res.json()) as { lead?: BrokerAcquisitionLead; error?: string };
    if (!res.ok) {
      setErr(j.error ?? "Failed to add");
      return;
    }
    if (j.lead) setLeads((prev) => [j.lead!, ...prev]);
    setFormName("");
    setFormNotes("");
  }

  async function patchStatus(id: string, status: BrokerAcquisitionLead["status"]) {
    setSavingId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/growth/broker-acquisition/execution-leads/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const j = (await res.json()) as { lead?: BrokerAcquisitionLead; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Update failed");
      if (j.lead) {
        setLeads((prev) => prev.map((x) => (x.id === id ? j.lead! : x)));
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">Loading broker acquisition…</p>
      </div>
    );
  }
  if (err && !crm && !scripts) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
        <p className="text-sm text-red-300">{err}</p>
      </div>
    );
  }

  const crmMax = crm
    ? Math.max(1, ...CRM_ORDER.map((k) => crm.byStatus[k] ?? 0))
    : 1;

  return (
    <section
      className="rounded-xl border border-sky-900/40 bg-sky-950/15 p-4"
      data-growth-broker-acquisition-panel-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-300/90">Broker acquisition (V1)</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Scripts + manual tracking</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Copy/paste outreach is draft-only — you send messages yourself. In-memory execution list resets on deploy; CRM
            prospects remain in admin.
          </p>
        </div>
        <Link
          href={adminHref}
          className="inline-flex shrink-0 items-center rounded-lg bg-sky-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          Open workspace →
        </Link>
      </div>

      {err ? <p className="mt-2 text-sm text-amber-300/90">{err}</p> : null}

      {crm ? (
        <div className="mt-4 rounded-lg border border-zinc-800/80 bg-black/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">CRM prospects (stored)</p>
          <p className="mt-1 text-sm text-zinc-400">
            Total: <strong className="text-white">{crm.total}</strong>
          </p>
          <ul className="mt-2 space-y-2">
            {CRM_ORDER.map((status) => {
              const n = crm.byStatus[status] ?? 0;
              const w = (n / crmMax) * 100;
              return (
                <li key={status} className="grid gap-1 text-sm">
                  <div className="flex justify-between gap-2 text-zinc-400">
                    <span className="capitalize text-zinc-300">{status.replace(/_/g, " ")}</span>
                    <span className="tabular-nums text-zinc-500">{n}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-sky-500/80" style={{ width: `${w}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            City placeholder
            <input
              className="w-44 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
        </div>

        {scripts && scripts.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {scripts.map((sc) => {
              const body = replaceCity(sc.message, city);
              return (
                <li key={sc.id} className="rounded-lg border border-zinc-800/90 bg-zinc-950/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-200">{sc.title}</p>
                    <span className="text-[11px] uppercase text-zinc-500">{sc.channel}</span>
                  </div>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-300">
                    {body}
                  </pre>
                  <div className="mt-2">
                    <CopyButton text={body} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No scripts loaded.</p>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-sky-900/30 bg-sky-950/20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-400/90">Manual execution list</p>
          <p className="text-sm text-zinc-400">
            Converted: <strong className="text-emerald-300">{convertedCount}</strong> / {leads.length}
          </p>
        </div>

        <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={addLead}>
          <label className="text-xs text-zinc-500">
            Name
            <input
              className="ml-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label className="text-xs text-zinc-500">
            Channel
            <select
              className="ml-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
              value={formChannel}
              onChange={(e) => setFormChannel(e.target.value as BrokerChannel)}
            >
              {CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 min-w-[120px] flex-col text-xs text-zinc-500">
            Notes
            <input
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600"
          >
            Add prospect
          </button>
        </form>

        <ul className="mt-4 space-y-2 text-sm">
          {leads.length === 0 ? (
            <li className="text-zinc-500">No manual rows yet — add a broker you are contacting.</li>
          ) : (
            leads.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-800/80 bg-black/20 px-2 py-2"
              >
                <div>
                  <p className="font-medium text-zinc-200">{l.name ?? "—"}</p>
                  <p className="text-[11px] text-zinc-500">
                    {l.channel} · {new Date(l.createdAt).toLocaleString()}
                  </p>
                  {l.notes ? <p className="text-xs text-zinc-500">{l.notes}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
                    value={l.status}
                    disabled={savingId === l.id}
                    onChange={(e) => void patchStatus(l.id, e.target.value as BrokerAcquisitionLead["status"])}
                  >
                    {EXEC_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
