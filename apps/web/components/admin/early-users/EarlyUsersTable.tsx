"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  name: string | null;
  type: "HOST" | "GUEST";
  contact: string;
  status: "CONTACTED" | "REPLIED" | "SIGNED_UP" | "ONBOARDED";
  source: string | null;
  conversionStage: string | null;
  conversionDate: string | null;
  followUpAt: string | null;
  conversionScore: number | null;
  leadTier: "LOW" | "MEDIUM" | "HIGH" | null;
  lastOutreachAt: string | null;
  notes: string | null;
  userId: string | null;
  user: { id: string; email: string } | null;
  createdAt: string;
};

const STATUSES: Row["status"][] = ["CONTACTED", "REPLIED", "SIGNED_UP", "ONBOARDED"];

export const SOURCE_OPTIONS = [
  { value: "", label: "—" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "fb_group", label: "Facebook group" },
  { value: "dm", label: "DM / direct" },
  { value: "referral", label: "Referral" },
  { value: "partner", label: "Partner" },
  { value: "landing", label: "Landing / early-access" },
  { value: "meta_ads", label: "Meta ads" },
  { value: "tiktok_ads", label: "TikTok ads" },
  { value: "seo", label: "SEO / organic" },
  { value: "other", label: "Other" },
];

const TIER_OPTIONS: { value: "" | "LOW" | "MEDIUM" | "HIGH"; label: string }[] = [
  { value: "", label: "—" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const TEMPLATES = {
  host: `Hi! We're launching BNHub in your area and promoting a small group of early hosts.

We bring extra visibility, lower fees, and active marketing.

Would you like to get early bookings and be featured?`,
  guest: `Hey! We're launching a new platform with better prices and verified listings.

We're giving early users priority deals and support.

Want to try it?`,
  followup: `Just checking in — we're actively promoting early users and listings right now, so it's a good time to join.`,
  close: `Great — I'll get you set up now. Under 5 minutes.`,
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EarlyUsersTable() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"HOST" | "GUEST">("HOST");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const qs = useCallback(() => {
    const p = new URLSearchParams();
    if (filterStatus !== "all") p.set("status", filterStatus);
    if (filterSource !== "all") p.set("source", filterSource);
    if (filterTier !== "all") p.set("leadTier", filterTier);
    const q = p.toString();
    return q ? `?${q}` : "";
  }, [filterStatus, filterSource, filterTier]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/early-users${qs()}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Row[];
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyTemplate(key: keyof typeof TEMPLATES) {
    try {
      await navigator.clipboard.writeText(TEMPLATES[key]);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Could not copy — select text manually.");
    }
  }

  async function addRow(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/early-users", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: contact.trim(),
          type,
          name: name.trim() || undefined,
          notes: notes.trim() || undefined,
          source: source || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setContact("");
      setName("");
      setNotes("");
      setSource("");
      await load();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function patchRow(id: string, patch: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/early-users/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json()) as Row;
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-200">Message templates (copy / paste)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Light automation — use in DMs or email. See also{" "}
          <code className="text-slate-400">docs/first-100-users.md</code>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["host", "Host opener"],
              ["guest", "Guest opener"],
              ["followup", "Follow-up"],
              ["close", "Close"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => void copyTemplate(k)}
              className="rounded border border-slate-600 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:border-premium-gold/50"
            >
              {copied === k ? "Copied" : `Copy: ${label}`}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={addRow} className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
        <h2 className="text-sm font-semibold text-slate-200">Add contact</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <input
            className="min-w-[200px] flex-1 rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Contact (email, @handle, phone)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />
          <input
            className="w-40 rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={type}
            onChange={(e) => setType(e.target.value as "HOST" | "GUEST")}
          >
            <option value="HOST">Host</option>
            <option value="GUEST">Guest</option>
          </select>
          <select
            className="rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value || "empty"} value={o.value}>
                {o.label === "—" ? "Source" : o.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-premium-gold px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
        <textarea
          className="mt-3 w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          placeholder="Notes (optional)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/30 px-4 py-3">
        <span className="text-xs font-medium uppercase text-slate-500">Filters</span>
        <select
          className="rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
        >
          <option value="all">All sources</option>
          {SOURCE_OPTIONS.filter((o) => o.value).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
        >
          <option value="all">All tiers</option>
          {TIER_OPTIONS.filter((o) => o.value).map((o) => (
            <option key={o.value} value={o.value!}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full min-w-[1280px] text-left text-sm text-slate-200">
          <thead className="border-b border-slate-700 bg-slate-900/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2">Contact</th>
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Source</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Stage</th>
              <th className="px-2 py-2">Score</th>
              <th className="px-2 py-2">Tier</th>
              <th className="px-2 py-2">Last out.</th>
              <th className="px-2 py-2">Conv. date</th>
              <th className="px-2 py-2">Follow-up</th>
              <th className="px-2 py-2">Notes</th>
              <th className="px-2 py-2">User</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-slate-500">
                  No rows match filters. Add a contact or adjust filters. Run migration if the table is missing.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-800">
                  <td className="px-2 py-2">{r.type}</td>
                  <td className="max-w-[120px] truncate px-2 py-2 font-mono text-xs" title={r.contact}>
                    {r.contact}
                  </td>
                  <td className="px-2 py-2">{r.name ?? "—"}</td>
                  <td className="px-2 py-2">
                    <select
                      className="max-w-[120px] rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      value={r.source ?? ""}
                      onChange={(e) =>
                        void patchRow(r.id, { source: e.target.value || null })
                      }
                    >
                      {SOURCE_OPTIONS.map((o) => (
                        <option key={o.value || "e"} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className="rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      value={r.status}
                      onChange={(e) =>
                        void patchRow(r.id, { status: e.target.value as Row["status"] })
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="max-w-[100px] px-2 py-2">
                    <input
                      className="w-full rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      placeholder="stage"
                      defaultValue={r.conversionStage ?? ""}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (r.conversionStage ?? ""))
                          void patchRow(r.id, { conversionStage: v || null });
                      }}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-14 rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      defaultValue={r.conversionScore ?? ""}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) {
                          if (r.conversionScore != null) void patchRow(r.id, { conversionScore: null });
                          return;
                        }
                        const n = Math.max(0, Math.min(100, Math.round(Number(raw))));
                        if (n !== r.conversionScore) void patchRow(r.id, { conversionScore: n });
                      }}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className="rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      value={r.leadTier ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        void patchRow(r.id, { leadTier: v ? (v as Row["leadTier"]) : null });
                      }}
                    >
                      {TIER_OPTIONS.map((o) => (
                        <option key={o.value || "e"} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="datetime-local"
                      className="w-[150px] rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      defaultValue={toDatetimeLocal(r.lastOutreachAt)}
                      onBlur={(e) => {
                        const v = e.target.value;
                        void patchRow(r.id, {
                          lastOutreachAt: v ? new Date(v).toISOString() : null,
                        });
                      }}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="datetime-local"
                      className="w-[150px] rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      defaultValue={toDatetimeLocal(r.conversionDate)}
                      onBlur={(e) => {
                        const v = e.target.value;
                        void patchRow(r.id, {
                          conversionDate: v ? new Date(v).toISOString() : null,
                        });
                      }}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="datetime-local"
                      className="w-[150px] rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      defaultValue={toDatetimeLocal(r.followUpAt)}
                      onBlur={(e) => {
                        const v = e.target.value;
                        void patchRow(r.id, {
                          followUpAt: v ? new Date(v).toISOString() : null,
                        });
                      }}
                    />
                  </td>
                  <td className="max-w-[180px] px-2 py-2">
                    <NotesCell initial={r.notes} onSave={(n) => void patchRow(r.id, { notes: n })} />
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-400">{r.user?.email ?? r.userId ?? "—"}</td>
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
  onSave: (notes: string | null) => void;
}) {
  const [val, setVal] = useState(initial ?? "");
  const [dirty, setDirty] = useState(false);
  const prev = useRef(initial);
  useEffect(() => {
    if (!dirty && prev.current !== initial) {
      setVal(initial ?? "");
      prev.current = initial;
    }
  }, [initial, dirty]);

  return (
    <div className="flex flex-col gap-1">
      <textarea
        className="w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-100"
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
          className="self-start text-xs text-emerald-400 hover:text-emerald-300"
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
