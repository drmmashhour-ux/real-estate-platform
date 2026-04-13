"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string;
  phone: string | null;
  segment: string;
  stage: string;
  notes: string | null;
  dealValueEstimateCents: number | null;
  followUpAt: string | null;
  leadScore: number | null;
  createdAt: string;
};

const SEGMENTS: { value: string; label: string }[] = [
  { value: "PROPERTY_MANAGEMENT", label: "Property management" },
  { value: "REAL_ESTATE_AGENCY", label: "Real estate agency" },
  { value: "MULTI_PROPERTY_HOST", label: "Multi-property host" },
  { value: "STR_OPERATOR", label: "STR operator" },
  { value: "TRAVEL_BUSINESS", label: "Travel-related business" },
];

const STAGES: { value: string; label: string }[] = [
  { value: "LEAD_IDENTIFIED", label: "1. Lead identified" },
  { value: "CONTACTED", label: "2. Contacted" },
  { value: "INTERESTED", label: "3. Interested" },
  { value: "DEMO_SCHEDULED", label: "4. Demo scheduled" },
  { value: "NEGOTIATION", label: "5. Negotiation" },
  { value: "CLOSED_WON", label: "6. Closed — won" },
  { value: "CLOSED_LOST", label: "Closed — lost" },
];

const INITIAL_OUTREACH = `Hi, I'm reaching out because we're launching BNHUB, a platform designed to help property managers increase visibility and bookings while simplifying operations.

We're onboarding a select group of partners and would like to explore if it could fit your portfolio.`;

const FOLLOW_UP = `Just following up — we're currently prioritizing early partners for additional exposure and support.`;

function moneyFromCents(cents: number | null) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SalesDashboardClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [dealSumCents, setDealSumCents] = useState(0);
  const [filterSegment, setFilterSegment] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [coName, setCoName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [seg, setSeg] = useState("PROPERTY_MANAGEMENT");
  const [dealDollars, setDealDollars] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (filterSegment !== "all") p.set("segment", filterSegment);
    if (filterStage !== "all") p.set("stage", filterStage);
    const q = p.toString();
    return q ? `?${q}` : "";
  }, [filterSegment, filterStage]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enterprise-leads${qs}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        leads: Lead[];
        pipeline: Record<string, number>;
        filteredDealValueSumCents: number;
      };
      setLeads(data.leads);
      setPipeline(data.pipeline);
      setDealSumCents(data.filteredDealValueSumCents);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Could not copy");
    }
  }

  async function patch(id: string, patch: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/enterprise-leads/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    if (!coName.trim() || !email.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const dollars = dealDollars.trim() ? Number(dealDollars) : NaN;
      const res = await fetch("/api/admin/enterprise-leads", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: coName.trim(),
          contactName: contactName.trim() || undefined,
          email: email.trim(),
          phone: phone.trim() || undefined,
          segment: seg,
          notes: addNotes.trim() || undefined,
          dealValueEstimateDollars: Number.isFinite(dollars) ? dollars : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCoName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setDealDollars("");
      setAddNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const maxStageCount = useMemo(() => {
    return Math.max(1, ...STAGES.map((s) => pipeline[s.value] ?? 0));
  }, [pipeline]);

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold text-slate-200">Pipeline</h2>
        <p className="mt-1 text-xs text-slate-500">Counts across all leads (not filtered). Won/lost for win rate tracking.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {STAGES.map((s) => {
            const n = pipeline[s.value] ?? 0;
            const pct = Math.round((n / maxStageCount) * 100);
            return (
              <div key={s.value} className="min-w-[140px] flex-1 rounded-lg border border-slate-700 bg-slate-950/80 p-3">
                <p className="text-[10px] font-medium uppercase text-slate-500">{s.label}</p>
                <p className="mt-1 text-xl font-semibold text-white">{n}</p>
                <div className="mt-2 h-1 overflow-hidden rounded bg-slate-800">
                  <div className="h-full bg-premium-gold/70" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Filtered pipeline deal estimate sum:{" "}
          <span className="font-medium text-slate-300">{moneyFromCents(dealSumCents)}</span> (rows with a value set)
        </p>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold text-slate-200">Scripts (copy)</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyText("init", INITIAL_OUTREACH)}
            className="rounded border border-slate-600 bg-slate-950 px-3 py-1.5 text-xs text-slate-200"
          >
            {copied === "init" ? "Copied" : "Initial outreach"}
          </button>
          <button
            type="button"
            onClick={() => void copyText("fu", FOLLOW_UP)}
            className="rounded border border-slate-600 bg-slate-950 px-3 py-1.5 text-xs text-slate-200"
          >
            {copied === "fu" ? "Copied" : "Follow-up"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Demo + closing scripts: <code className="text-slate-400">docs/sales-scripts.md</code> in the repository.
        </p>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold text-slate-200">Add lead</h2>
        <form onSubmit={addLead} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <input
              className="min-w-[200px] flex-1 rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Company *"
              value={coName}
              onChange={(e) => setCoName(e.target.value)}
              required
            />
            <input
              className="w-48 rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Contact name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <input
              className="min-w-[200px] flex-1 rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Email *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-40 rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <select
              className="rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
              value={seg}
              onChange={(e) => setSeg(e.target.value)}
            >
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <input
              className="w-36 rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Deal est. ($)"
              inputMode="decimal"
              value={dealDollars}
              onChange={(e) => setDealDollars(e.target.value)}
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-premium-gold px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add"}
            </button>
          </div>
          <textarea
            className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Notes"
            rows={2}
            value={addNotes}
            onChange={(e) => setAddNotes(e.target.value)}
          />
        </form>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase text-slate-500">Filters</span>
        <select
          className="rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs"
          value={filterSegment}
          onChange={(e) => setFilterSegment(e.target.value)}
        >
          <option value="all">All segments</option>
          {SEGMENTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs"
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
        >
          <option value="all">All stages</option>
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full min-w-[1100px] text-left text-sm text-slate-200">
          <thead className="border-b border-slate-700 bg-slate-900/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-2 py-2">Company</th>
              <th className="px-2 py-2">Contact</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Segment</th>
              <th className="px-2 py-2">Stage</th>
              <th className="px-2 py-2">Score</th>
              <th className="px-2 py-2">Deal est.</th>
              <th className="px-2 py-2">Follow-up</th>
              <th className="px-2 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                  No leads. Add one or run migration. See docs/enterprise-sales.md
                </td>
              </tr>
            ) : (
              leads.map((r) => (
                <tr key={r.id} className="border-b border-slate-800">
                  <td className="px-2 py-2 font-medium">{r.companyName}</td>
                  <td className="px-2 py-2">{r.contactName ?? "—"}</td>
                  <td className="px-2 py-2 font-mono text-xs">{r.email}</td>
                  <td className="px-2 py-2">
                    <select
                      className="max-w-[160px] rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      value={r.segment}
                      onChange={(e) => void patch(r.id, { segment: e.target.value })}
                    >
                      {SEGMENTS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className="max-w-[180px] rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      value={r.stage}
                      onChange={(e) =>
                        void patch(r.id, { stage: e.target.value, syncScoreFromStage: true })
                      }
                    >
                      {STAGES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-14 rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      defaultValue={r.leadScore ?? ""}
                      key={`${r.id}-score-${r.leadScore}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (!v) {
                          if (r.leadScore != null) void patch(r.id, { leadScore: null });
                          return;
                        }
                        const n = Math.max(0, Math.min(100, Math.round(Number(v))));
                        if (n !== r.leadScore) void patch(r.id, { leadScore: n });
                      }}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-24 rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      defaultValue={r.dealValueEstimateCents != null ? String(r.dealValueEstimateCents / 100) : ""}
                      key={`${r.id}-deal-${r.dealValueEstimateCents}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (!v) {
                          if (r.dealValueEstimateCents != null) void patch(r.id, { dealValueEstimateCents: null });
                          return;
                        }
                        const d = Number(v);
                        if (!Number.isFinite(d)) return;
                        const cents = Math.round(d * 100);
                        if (cents !== r.dealValueEstimateCents) void patch(r.id, { dealValueEstimateDollars: d });
                      }}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="datetime-local"
                      className="w-[155px] rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      defaultValue={toDatetimeLocal(r.followUpAt)}
                      key={`${r.id}-fu-${r.followUpAt}`}
                      onBlur={(e) => {
                        const v = e.target.value;
                        void patch(r.id, { followUpAt: v ? new Date(v).toISOString() : null });
                      }}
                    />
                    <button
                      type="button"
                      className="mt-1 block text-[10px] text-emerald-400 hover:text-emerald-300"
                      onClick={() => {
                        const t = new Date();
                        t.setDate(t.getDate() + 7);
                        void patch(r.id, { followUpAt: t.toISOString() });
                      }}
                    >
                      +7d
                    </button>
                  </td>
                  <td className="max-w-[200px] px-2 py-2">
                    <NotesCell initial={r.notes} onSave={(n) => void patch(r.id, { notes: n })} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotesCell({
  initial,
  onSave,
}: {
  initial: string | null;
  onSave: (n: string | null) => void;
}) {
  const [val, setVal] = useState(initial ?? "");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setVal(initial ?? "");
  }, [initial, dirty]);

  return (
    <div className="flex flex-col gap-1">
      <textarea
        className="w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs"
        rows={2}
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
          setDirty(true);
        }}
      />
      {dirty && (
        <button
          type="button"
          className="self-start text-[10px] text-emerald-400"
          onClick={() => {
            onSave(val.trim() || null);
            setDirty(false);
          }}
        >
          Save notes
        </button>
      )}
    </div>
  );
}
