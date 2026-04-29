"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { BROKER_ACQUISITION_SCRIPTS } from "@/modules/growth/broker-acquisition-scripts";
import {
  final_close,
  follow_up,
  getCloseSmartRecommendation,
  objection_info,
  objection_not_sure,
  objection_price,
  show_lead_invite,
} from "@/modules/growth/broker-close-scripts";
import { BROKER_PROSPECT_STATUSES } from "@/modules/growth/broker-prospect.constants";

type Prospect = {
  id: string;
  name: string;
  agency: string | null;
  phone: string;
  email: string;
  source: string;
  status: string;
  notes: string | null;
  linkedBrokerUserId: string | null;
  firstPurchaseAt: string | null;
  totalSpentCents: number;
  demoLeadUsedAt: string | null;
  lastCloseMessageType: string | null;
  lastCloseContactAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type LeadPreview = {
  location: string;
  intent: string;
  budget: string | null;
  shortMessage: string;
};

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text).catch(() => {
    window.alert("Could not copy — try again.");
  });
}

export function BrokersAcquisitionClient() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sample, setSample] = useState<{
    location: string;
    intent: string;
    budget: string | null;
    shortMessage: string;
  } | null>(null);
  const [sampleErr, setSampleErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<"manual" | "instagram" | "referral">("manual");
  const [saving, setSaving] = useState(false);
  /** Which prospect row is showing inline lead preview */
  const [leadPreviewForId, setLeadPreviewForId] = useState<string | null>(null);
  const [leadPreview, setLeadPreview] = useState<LeadPreview | null>(null);
  const [leadPreviewLoading, setLeadPreviewLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/broker-prospects", { credentials: "same-origin" });
      if (!res.ok) throw new Error("load");
      const data = (await res.json()) as { prospects: Prospect[] };
      setProspects(Array.isArray(data.prospects) ? data.prospects : []);
    } catch {
      setProspects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const total = prospects.length;
    const contacted = prospects.filter((p) => p.status === "contacted").length;
    const replied = prospects.filter((p) => p.status === "replied").length;
    const demo = prospects.filter((p) => p.status === "demo_scheduled").length;
    const converted = prospects.filter((p) => p.status === "converted").length;
    const rateDen = Math.max(1, contacted);
    const conversionRate = converted / rateDen;
    return { total, contacted, replied, demo, converted, conversionRate };
  }, [prospects]);

  const dailyActions = useMemo(() => {
    const lines: string[] = [];
    if (metrics.total < 10) {
      lines.push("Add 5 new brokers — you are under 10 prospects (first-10 goal).");
    }
    if (metrics.contacted > 0 && metrics.replied === 0) {
      lines.push("Send follow-ups — you have contacted brokers but no replies logged yet.");
    }
    if (metrics.replied > 0 || metrics.demo > 0) {
      lines.push("Push to demo — move warm replies to “Demo scheduled”.");
    }
    if (lines.length === 0) {
      lines.push("Review pipeline and log notes after each touch.");
    }
    return lines;
  }, [metrics]);

  const addProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/broker-prospects", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim(), source }),
      });
      if (!res.ok) throw new Error("save");
      setName("");
      setPhone("");
      setEmail("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/broker-prospects/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    await load();
  };

  const recordCloseTouch = async (
    id: string,
    lastCloseMessageType: "follow_up" | "close" | "demo" | "objection",
  ) => {
    await patch(id, { lastCloseMessageType, touchCloseContact: true });
  };

  const copyAndRecord = async (
    id: string,
    text: string,
    lastCloseMessageType: "follow_up" | "close" | "demo" | "objection",
  ) => {
    copyToClipboard(text);
    await recordCloseTouch(id, lastCloseMessageType);
  };

  const syncConversions = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/broker-prospects/sync-conversions", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { updated?: number };
      await load();
      window.alert(`Sync complete. Updated: ${data.updated ?? 0} prospect(s) with paid lead unlocks.`);
    } finally {
      setSyncing(false);
    }
  };

  const loadSample = async () => {
    setSampleErr(null);
    setSample(null);
    const res = await fetch("/api/admin/broker-prospects/sample-lead", { credentials: "same-origin" });
    if (!res.ok) {
      setSampleErr("No sample available yet (need at least one lead with a message).");
      return;
    }
    const data = (await res.json()) as {
      preview: { location: string; intent: string; budget: string | null; shortMessage: string };
    };
    setSample(data.preview);
  };

  const loadSampleForProspect = async (prospectId: string) => {
    setLeadPreviewForId(prospectId);
    setLeadPreview(null);
    setLeadPreviewLoading(true);
    try {
      const res = await fetch("/api/admin/broker-prospects/sample-lead", { credentials: "same-origin" });
      if (!res.ok) {
        window.alert("No lead available for preview yet.");
        setLeadPreviewForId(null);
        return;
      }
      const data = (await res.json()) as { preview: LeadPreview };
      setLeadPreview(data.preview);
      await recordCloseTouch(prospectId, "demo");
    } finally {
      setLeadPreviewLoading(false);
    }
  };

  const copyLeadPreviewShare = (p: LeadPreview) => {
    const block = `${show_lead_invite}\n\n${JSON.stringify(
      { location: p.location, intent: p.intent, budget: p.budget, shortMessage: p.shortMessage },
      null,
      2,
    )}`;
    copyToClipboard(block);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 text-white sm:px-6">
      <aside className="rounded-2xl border border-zinc-600/50 bg-zinc-900/90 p-4 text-sm text-zinc-300">
        <p className="font-semibold text-amber-200">Legacy Prisma CRM</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          This page reads/writes <strong className="text-zinc-300">database-backed</strong> broker prospects (first-10 style
          outreach). It is separate from the <strong className="text-zinc-300">V1 operator pipeline</strong> (in-memory /
          optional JSON file). For the current V1 board, open{" "}
          <a href="/admin/brokers-acquisition" className="font-semibold text-emerald-400 hover:underline">
            /admin/brokers-acquisition
          </a>
          .
        </p>
      </aside>

      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">Acquisition</p>
        <h1 className="mt-2 text-3xl font-bold">First 10 brokers</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          CRM-lite for outreach: track prospects, copy scripts, preview a masked lead, and sync conversions from paid
          lead unlocks (reads payments only — no Stripe changes).
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Total prospects" value={metrics.total} />
        <Metric label="Contacted" value={metrics.contacted} />
        <Metric label="Replied" value={metrics.replied} />
        <Metric label="Converted" value={metrics.converted} />
        <div className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase text-zinc-500">Conv. / contacted</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">
            {(metrics.conversionRate * 100).toFixed(0)}%
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5">
        <h2 className="text-lg font-semibold text-amber-200">Today&apos;s actions</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-300">
          {dailyActions.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => void syncConversions()}
          disabled={syncing}
          className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-500 disabled:opacity-50"
        >
          {syncing ? "Syncing…" : "Sync conversions from lead unlock payments"}
        </button>
        <p className="mt-2 text-xs text-zinc-500">
          Matches prospect email to a broker account, then sums paid <code className="text-zinc-400">lead_unlock</code>{" "}
          platform payments.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
        <h2 className="text-lg font-semibold">Sample lead preview</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Uses one real lead with PII removed — show brokers what intake looks like.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadSample()}
            className="rounded-xl border border-amber-500/50 px-4 py-2 text-sm font-semibold text-amber-400 hover:bg-amber-500/10"
          >
            Show sample lead
          </button>
        </div>
        {sampleErr ? <p className="mt-3 text-sm text-red-400">{sampleErr}</p> : null}
        {sample ? (
          <pre className="mt-4 overflow-x-auto rounded-xl border border-zinc-800 bg-black/50 p-4 text-xs text-zinc-300">
            {JSON.stringify(
              {
                location: sample.location,
                intent: sample.intent,
                budget: sample.budget,
                shortMessage: sample.shortMessage,
              },
              null,
              2,
            )}
          </pre>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
        <h2 className="text-lg font-semibold">Quick add prospect</h2>
        <form onSubmit={addProspect} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block flex-1 min-w-[10rem] text-sm">
            <span className="text-zinc-500">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="block flex-1 min-w-[10rem] text-sm">
            <span className="text-zinc-500">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="block flex-1 min-w-[12rem] text-sm">
            <span className="text-zinc-500">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500">Source</span>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as typeof source)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            >
              <option value="manual">Manual</option>
              <option value="instagram">Instagram</option>
              <option value="referral">Referral</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] rounded-xl bg-amber-600 px-6 text-sm font-bold text-black hover:bg-amber-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Pipeline</h2>
        <p className="mt-1 text-xs text-zinc-500">
          NEW → CONTACTED → REPLIED → DEMO → CONVERTED (or LOST)
        </p>
        {loading ? (
          <p className="mt-6 text-zinc-500">Loading…</p>
        ) : prospects.length === 0 ? (
          <p className="mt-6 text-zinc-500">No prospects yet — add your first broker above.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-black/40 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-3">Name / agency</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Last close</th>
                  <th className="px-3 py-3">Demo</th>
                  <th className="px-3 py-3">Spend</th>
                  <th className="px-3 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => {
                  const reco = getCloseSmartRecommendation(p.status);
                  return (
                    <Fragment key={p.id}>
                      <tr className="border-b border-zinc-800/80 hover:bg-white/[0.02]">
                        <td className="px-3 py-3 align-top">
                          <div className="font-medium">{p.name}</div>
                          {p.agency ? <div className="text-xs text-zinc-500">{p.agency}</div> : null}
                          <div className="text-[10px] uppercase text-zinc-600">{p.source}</div>
                        </td>
                        <td className="px-3 py-3 align-top text-xs text-zinc-400">
                          <div>{p.email}</div>
                          {p.phone ? <div>{p.phone}</div> : null}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <select
                            value={p.status}
                            onChange={(e) => void patch(p.id, { status: e.target.value })}
                            className="rounded-lg border border-zinc-700 bg-black px-2 py-1 text-xs text-white"
                          >
                            {BROKER_PROSPECT_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 align-top text-[10px] text-zinc-500">
                          {p.lastCloseMessageType ? (
                            <span className="text-amber-500/90">{p.lastCloseMessageType.replace(/_/g, " ")}</span>
                          ) : (
                            "—"
                          )}
                          {p.lastCloseContactAt ? (
                            <div className="text-zinc-600">
                              {new Date(p.lastCloseContactAt).toLocaleString()}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 align-top text-xs">
                          <label className="flex items-center gap-2 text-zinc-400">
                            <input
                              type="checkbox"
                              checked={Boolean(p.demoLeadUsedAt)}
                              onChange={(e) => void patch(p.id, { demoLeadUsed: e.target.checked })}
                            />
                            Demo lead used
                          </label>
                        </td>
                        <td className="px-3 py-3 align-top text-xs tabular-nums text-zinc-400">
                          {p.totalSpentCents > 0 ? (
                            <>
                              ${(p.totalSpentCents / 100).toFixed(2)}
                              {p.firstPurchaseAt ? (
                                <div className="text-[10px] text-zinc-600">
                                  First: {new Date(p.firstPurchaseAt).toLocaleDateString()}
                                </div>
                              ) : null}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <textarea
                            defaultValue={p.notes ?? ""}
                            rows={2}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v !== (p.notes ?? "").trim()) void patch(p.id, { notes: v || null });
                            }}
                            className="w-full min-w-[12rem] rounded-lg border border-zinc-700 bg-black px-2 py-1 text-xs text-white"
                            placeholder="Notes…"
                          />
                        </td>
                      </tr>
                      <tr className="border-b border-zinc-800 bg-zinc-950/60">
                        <td colSpan={7} className="px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500/90">
                            Smart suggestion · {reco.title}
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">{reco.action}</p>

                          <div className="mt-3 border-t border-zinc-800 pt-3">
                            <p className="text-xs font-semibold text-amber-500/90">Close tools</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                className="rounded border border-zinc-600 px-2 py-1 text-[10px] text-amber-400 hover:bg-zinc-800"
                                onClick={() => void copyAndRecord(p.id, objection_not_sure, "objection")}
                              >
                                Copy “Not sure”
                              </button>
                              <button
                                type="button"
                                className="rounded border border-zinc-600 px-2 py-1 text-[10px] text-amber-400 hover:bg-zinc-800"
                                onClick={() => void copyAndRecord(p.id, objection_price, "objection")}
                              >
                                Copy “Price”
                              </button>
                              <button
                                type="button"
                                className="rounded border border-zinc-600 px-2 py-1 text-[10px] text-amber-400 hover:bg-zinc-800"
                                onClick={() => void copyAndRecord(p.id, objection_info, "objection")}
                              >
                                Copy “Info”
                              </button>
                              <button
                                type="button"
                                className="rounded border border-zinc-600 px-2 py-1 text-[10px] text-amber-400 hover:bg-zinc-800"
                                onClick={() => void copyAndRecord(p.id, follow_up, "follow_up")}
                              >
                                Copy follow-up
                              </button>
                              <button
                                type="button"
                                className="rounded border border-zinc-600 px-2 py-1 text-[10px] text-amber-400 hover:bg-zinc-800"
                                onClick={() => void copyAndRecord(p.id, final_close, "close")}
                              >
                                Copy final close
                              </button>
                              <button
                                type="button"
                                className="rounded border border-emerald-600/50 px-2 py-1 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-950/40"
                                onClick={() => void loadSampleForProspect(p.id)}
                              >
                                {leadPreviewLoading && leadPreviewForId === p.id
                                  ? "Loading…"
                                  : "Show lead"}
                              </button>
                              <button
                                type="button"
                                className="rounded border border-zinc-600 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-800"
                                onClick={() => void copyAndRecord(p.id, show_lead_invite, "demo")}
                              >
                                Copy “Show lead” pitch
                              </button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1 border-t border-dashed border-zinc-800 pt-2">
                              <span className="w-full text-[10px] text-zinc-600">Quick outreach</span>
                              <button
                                type="button"
                                className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-800"
                                onClick={() => copyToClipboard(BROKER_ACQUISITION_SCRIPTS.firstMessage)}
                              >
                                First message
                              </button>
                              <button
                                type="button"
                                className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-800"
                                onClick={() => copyToClipboard(BROKER_ACQUISITION_SCRIPTS.followUp)}
                              >
                                Acquisition follow-up
                              </button>
                              <button
                                type="button"
                                className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-800"
                                onClick={() => copyToClipboard(BROKER_ACQUISITION_SCRIPTS.close)}
                              >
                                Acquisition close
                              </button>
                            </div>
                          </div>

                          {leadPreviewForId === p.id && leadPreview ? (
                            <div className="mt-3 rounded-xl border border-emerald-500/30 bg-black/50 p-3">
                              <p className="text-xs font-semibold text-emerald-400">Lead preview (masked)</p>
                              <pre className="mt-2 max-h-48 overflow-auto text-[11px] text-zinc-300">
                                {JSON.stringify(leadPreview, null, 2)}
                              </pre>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                                  onClick={() => copyLeadPreviewShare(leadPreview)}
                                >
                                  Copy for share
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                                  onClick={() => setLeadPreviewForId(null)}
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
