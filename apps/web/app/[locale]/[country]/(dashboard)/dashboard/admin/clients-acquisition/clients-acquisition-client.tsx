"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const GOLD = "var(--color-premium-gold)";

type LeadRow = {
  id: string;
  name: string;
  source: string;
  phone: string | null;
  notes: string | null;
  messageSent: boolean;
  replied: boolean;
  interested: boolean;
  callScheduled: boolean;
  closed: boolean;
  messageSentAt: string | null;
  repliedAt: string | null;
  interestedAt: string | null;
  callAt: string | null;
  closedAt: string | null;
  serviceType: string | null;
  valueCents: number | null;
  revenueCents: number | null;
  createdAt: string;
  updatedAt: string;
};

type Bundle = {
  targets: { contacts: number; leads: number; callsBooked: number; clientsClosed: number };
  daily: {
    contactsCount: number;
    leadsCount: number;
    callsBookedCount: number;
    clientsClosedCount: number;
    date: string;
  };
  conversion: {
    messagesSent: number;
    replies: number;
    callsScheduled: number;
    clientsClosed: number;
  };
  leads: LeadRow[];
  scripts: {
    dm: readonly { id: string; label: string; text: string }[];
    callFlow: {
      discovery: readonly string[];
      position: string;
      close: string;
    };
    followUp: readonly { day: number; label: string; hint: string }[];
    motivation: string;
  };
};

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function utcDaysBetween(fromIso: string, to = new Date()): number {
  const a = startOfUtcDay(new Date(fromIso)).getTime();
  const b = startOfUtcDay(to).getTime();
  return Math.floor((b - a) / 86_400_000);
}

function ProgressBar({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-[#B3B3B3]">
        <span>{label}</span>
        <span className="font-mono text-premium-gold">
          {value} / {target}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8a7020] to-premium-gold transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="rounded-lg px-3 py-1.5 text-xs font-bold text-black"
      style={{ background: GOLD }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

function phoneDigits(phone: string | null): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  return d.length >= 10 ? d : null;
}

export function ClientsAcquisitionClient() {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dmIndex, setDmIndex] = useState(0);

  const [newName, setNewName] = useState("");
  const [newSource, setNewSource] = useState("facebook");
  const [newPhone, setNewPhone] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/dashboard/client-acquisition", { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Failed to load");
      setBundle(j as Bundle);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchLead = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      setErr(null);
      const res = await fetch(`/api/dashboard/client-acquisition/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? "Update failed");
        return;
      }
      await load();
    },
    [load]
  );

  const bumpDaily = useCallback(
    async (field: "contacts" | "leads" | "callsBooked" | "clientsClosed") => {
      setErr(null);
      const res = await fetch("/api/dashboard/client-acquisition/daily-bump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? "Bump failed");
        return;
      }
      await load();
    },
    [load]
  );

  const addLead = useCallback(async () => {
    if (!newName.trim()) return;
    setSavingNew(true);
    setErr(null);
    try {
      const res = await fetch("/api/dashboard/client-acquisition/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          source: newSource,
          phone: newPhone.trim() || null,
          notes: newNotes.trim() || null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Failed to add");
      setNewName("");
      setNewPhone("");
      setNewNotes("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSavingNew(false);
    }
  }, [newName, newSource, newPhone, newNotes, load]);

  const closedWins = useMemo(() => (bundle?.leads ?? []).filter((l) => l.closed), [bundle?.leads]);

  const activeDm = bundle?.scripts.dm[dmIndex]?.text ?? "";

  if (loading && !bundle) {
    return <p className="mt-8 text-sm text-[#B3B3B3]">Loading acquisition workspace…</p>;
  }

  if (!bundle) {
    return <p className="mt-8 text-sm text-red-300">{err ?? "Unable to load."}</p>;
  }

  const { targets, daily, conversion, leads, scripts } = bundle;

  return (
    <div className="mt-10 space-y-12 pb-16">
      {err ? (
        <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{err}</div>
      ) : null}

      {/* Motivation */}
      <section
        className="rounded-2xl border border-premium-gold/35 bg-gradient-to-br from-[#1a1508] to-[#0B0B0B] p-6 shadow-lg shadow-black/50"
        aria-label="Motivation"
      >
        <p className="text-lg font-semibold leading-relaxed text-white md:text-xl">{scripts.motivation}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-premium-gold/80">Stay high-touch until 10 are real.</p>
      </section>

      {/* Daily targets */}
      <section aria-labelledby="daily-heading">
        <h2 id="daily-heading" className="text-lg font-bold text-white">
          Daily targets
        </h2>
        <p className="mt-1 text-xs text-[#737373]">Progress uses today’s UTC counters (row actions + manual bumps).</p>
        <div className="mt-4 grid gap-4 rounded-2xl border border-white/10 bg-[#121212] p-5 md:grid-cols-2">
          <ProgressBar label="Contact people (DMs / touches)" value={daily.contactsCount} target={targets.contacts} />
          <ProgressBar label="Capture leads (rows added today)" value={daily.leadsCount} target={targets.leads} />
          <ProgressBar label="Book calls" value={daily.callsBookedCount} target={targets.callsBooked} />
          <ProgressBar label="Close clients" value={daily.clientsClosedCount} target={targets.clientsClosed} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void bumpDaily("contacts")}
            className="rounded-lg border border-premium-gold/40 px-3 py-2 text-xs font-semibold text-premium-gold hover:bg-premium-gold/10"
          >
            +1 contact (manual)
          </button>
          <button
            type="button"
            onClick={() => void bumpDaily("leads")}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-[#B3B3B3] hover:bg-white/5"
          >
            +1 lead (manual)
          </button>
          <button
            type="button"
            onClick={() => void bumpDaily("callsBooked")}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-[#B3B3B3] hover:bg-white/5"
          >
            +1 call booked
          </button>
          <button
            type="button"
            onClick={() => void bumpDaily("clientsClosed")}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-[#B3B3B3] hover:bg-white/5"
          >
            +1 client closed
          </button>
        </div>
      </section>

      {/* Conversion tracker */}
      <section aria-labelledby="conversion-heading">
        <h2 id="conversion-heading" className="text-lg font-bold text-white">
          Conversion tracker
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Messages sent", conversion.messagesSent],
              ["Replies", conversion.replies],
              ["Calls scheduled", conversion.callsScheduled],
              ["Clients closed", conversion.clientsClosed],
            ] as const
          ).map(([t, v]) => (
            <div key={t} className="rounded-2xl border border-premium-gold/20 bg-black/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-premium-gold">{t}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DM scripts */}
      <section aria-labelledby="dm-heading">
        <h2 id="dm-heading" className="text-lg font-bold text-white">
          DM scripts
        </h2>
        <div className="mt-4 space-y-4">
          {scripts.dm.map((s, i) => (
            <div key={s.id} className="rounded-2xl border border-white/10 bg-[#121212] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-white">{s.label}</h3>
                <CopyBtn text={s.text} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#D1D5DB]">{s.text}</p>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-[#9CA3AF]">
                <input type="radio" name="dmPick" checked={dmIndex === i} onChange={() => setDmIndex(i)} className="accent-premium-gold" />
                Use for quick “Copy message” on leads
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Call script */}
      <section aria-labelledby="call-heading">
        <h2 id="call-heading" className="text-lg font-bold text-white">
          Call script (simple flow)
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#121212] p-4 md:col-span-1">
            <p className="text-xs font-bold uppercase tracking-widest text-premium-gold">1 · Ask</p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[#D1D5DB]">
              {scripts.callFlow.discovery.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#121212] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-premium-gold">2 · Position</p>
            <p className="mt-3 text-sm leading-relaxed text-premium-gold">{scripts.callFlow.position}</p>
            <CopyBtn text={scripts.callFlow.position} label="Copy line" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#121212] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-premium-gold">3 · Close</p>
            <p className="mt-3 text-sm leading-relaxed text-premium-gold">{scripts.callFlow.close}</p>
            <CopyBtn text={scripts.callFlow.close} label="Copy line" />
          </div>
        </div>
      </section>

      {/* Follow-up automation */}
      <section aria-labelledby="fu-heading">
        <h2 id="fu-heading" className="text-lg font-bold text-white">
          Follow-up automation (rhythm)
        </h2>
        <p className="mt-1 text-sm text-[#737373]">Use these checkpoints from first outreach — reminders below surface per lead by age.</p>
        <ul className="mt-4 space-y-2">
          {scripts.followUp.map((f) => (
            <li key={f.day} className="flex flex-col gap-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-premium-gold">{f.label}</span>
              <span className="text-xs text-[#9CA3AF]">{f.hint}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Add lead */}
      <section aria-labelledby="add-heading">
        <h2 id="add-heading" className="text-lg font-bold text-white">
          Add outreach lead
        </h2>
        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-[#121212] p-4 sm:grid-cols-2">
          <label className="text-xs text-[#9CA3AF] sm:col-span-2">
            Name
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white"
              placeholder="e.g. Alex"
            />
          </label>
          <label className="text-xs text-[#9CA3AF]">
            Source
            <select
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white"
            >
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="marketplace">Marketplace</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-xs text-[#9CA3AF]">
            Phone
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white"
              placeholder="+1 …"
            />
          </label>
          <label className="text-xs text-[#9CA3AF] sm:col-span-2">
            Notes
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white"
              placeholder="Context, ad post, listing link…"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={savingNew || !newName.trim()}
              onClick={() => void addLead()}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-black disabled:opacity-40"
              style={{ background: GOLD }}
            >
              {savingNew ? "Saving…" : "Save lead"}
            </button>
          </div>
        </div>
      </section>

      {/* Leads / outreach tracker */}
      <section aria-labelledby="leads-heading">
        <h2 id="leads-heading" className="text-lg font-bold text-white">
          Outreach tracker
        </h2>
        <p className="mt-1 text-sm text-[#737373]">
          Toggle stages · 🔥 when replied + interested · quick copy / call / WhatsApp
        </p>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/60 text-[10px] uppercase tracking-widest text-premium-gold">
                <th className="px-3 py-3">Lead</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3 text-center">Msg</th>
                <th className="px-3 py-3 text-center">Reply</th>
                <th className="px-3 py-3 text-center">Interest</th>
                <th className="px-3 py-3 text-center">Call</th>
                <th className="px-3 py-3 text-center">Closed</th>
                <th className="px-3 py-3">Follow-up</th>
                <th className="px-3 py-3">Notes / win</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-[#737373]">
                    No leads yet — add your first row above.
                  </td>
                </tr>
              ) : (
                leads.map((l) => {
                  const hot = l.replied && l.interested;
                  const age = utcDaysBetween(l.createdAt);
                  let rhythm: (typeof scripts.followUp)[number] | null = null;
                  if (!l.closed) {
                    if (age >= 7) rhythm = scripts.followUp[2];
                    else if (age >= 3) rhythm = scripts.followUp[1];
                    else if (age >= 1) rhythm = scripts.followUp[0];
                  }

                  const wa = phoneDigits(l.phone);
                  const waUrl = wa
                    ? `https://wa.me/${wa}?text=${encodeURIComponent(activeDm || scripts.dm[0].text)}`
                    : null;

                  return (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-3 py-3 align-top">
                        <div className="font-medium text-white">{l.name}</div>
                        {hot ? (
                          <span className="mt-1 inline-block rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                            🔥 HOT LEAD
                          </span>
                        ) : null}
                        {l.phone ? <div className="mt-1 font-mono text-xs text-[#9CA3AF]">{l.phone}</div> : null}
                      </td>
                      <td className="px-3 py-3 align-top capitalize text-[#B3B3B3]">{l.source}</td>
                      {(["messageSent", "replied", "interested", "callScheduled", "closed"] as const).map((k) => (
                        <td key={k} className="px-3 py-3 text-center align-top">
                          <input
                            type="checkbox"
                            checked={l[k]}
                            onChange={(e) => void patchLead(l.id, { [k]: e.target.checked })}
                            className="h-4 w-4 accent-premium-gold"
                            aria-label={`${k} for ${l.name}`}
                          />
                        </td>
                      ))}
                      <td className="max-w-[140px] px-3 py-3 align-top text-xs text-[#9CA3AF]">
                        {l.closed ? "—" : rhythm ? <span className="text-premium-gold">{rhythm.label}</span> : null}
                        {!l.closed && age < 1 ? <div className="text-[#737373]">Day 0 · first touch</div> : null}
                      </td>
                      <td className="min-w-[200px] px-3 py-3 align-top">
                        <textarea
                          defaultValue={l.notes ?? ""}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== (l.notes ?? "")) void patchLead(l.id, { notes: v || null });
                          }}
                          rows={2}
                          className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs text-white"
                          placeholder="Notes…"
                        />
                        {l.closed ? (
                          <div className="mt-2 space-y-1 rounded-lg border border-premium-gold/20 bg-black/40 p-2">
                            <label className="block text-[10px] text-[#9CA3AF]">
                              Service
                              <select
                                value={l.serviceType ?? ""}
                                onChange={(e) =>
                                  void patchLead(l.id, { serviceType: e.target.value || null })
                                }
                                className="mt-0.5 w-full rounded border border-white/15 bg-black px-2 py-1 text-xs text-white"
                              >
                                <option value="">—</option>
                                <option value="mortgage">Mortgage</option>
                                <option value="rent">Rent</option>
                                <option value="buy">Buy</option>
                              </select>
                            </label>
                            <label className="block text-[10px] text-[#9CA3AF]">
                              Value (CAD)
                              <input
                                key={`val-${l.id}-${l.updatedAt}`}
                                type="number"
                                min={0}
                                step={1}
                                defaultValue={l.valueCents != null ? Math.round(l.valueCents / 100) : ""}
                                onBlur={(e) => {
                                  const n = parseFloat(e.target.value);
                                  void patchLead(l.id, {
                                    valueCents: Number.isFinite(n) ? Math.round(n * 100) : null,
                                  });
                                }}
                                className="mt-0.5 w-full rounded border border-white/15 bg-black px-2 py-1 text-xs text-white"
                              />
                            </label>
                            <label className="block text-[10px] text-[#9CA3AF]">
                              Revenue (CAD)
                              <input
                                key={`rev-${l.id}-${l.updatedAt}`}
                                type="number"
                                min={0}
                                step={1}
                                defaultValue={l.revenueCents != null ? Math.round(l.revenueCents / 100) : ""}
                                onBlur={(e) => {
                                  const n = parseFloat(e.target.value);
                                  void patchLead(l.id, {
                                    revenueCents: Number.isFinite(n) ? Math.round(n * 100) : null,
                                  });
                                }}
                                className="mt-0.5 w-full rounded border border-white/15 bg-black px-2 py-1 text-xs text-white"
                              />
                            </label>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            className="rounded-lg border border-premium-gold/35 px-2 py-1 text-[10px] font-semibold text-premium-gold hover:bg-premium-gold/10"
                            onClick={() => {
                              void navigator.clipboard.writeText(activeDm || scripts.dm[0].text);
                            }}
                          >
                            Copy message
                          </button>
                          {l.phone ? (
                            <a
                              href={`tel:${l.phone.replace(/\s/g, "")}`}
                              className="rounded-lg border border-white/15 px-2 py-1 text-center text-[10px] font-semibold text-white hover:bg-white/5"
                            >
                              Call
                            </a>
                          ) : (
                            <span className="text-[10px] text-[#555]">No phone</span>
                          )}
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-emerald-600/40 px-2 py-1 text-center text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/10"
                            >
                              WhatsApp
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Success log */}
      <section aria-labelledby="success-heading">
        <h2 id="success-heading" className="text-lg font-bold text-white">
          Success log
        </h2>
        <p className="mt-1 text-sm text-[#737373]">Closed clients — service, deal value, and revenue captured.</p>
        {closedWins.length === 0 ? (
          <p className="mt-4 text-sm text-[#737373]">No closed rows yet. Mark “Closed” on a lead to unlock win fields.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {closedWins.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-premium-gold/25 bg-[#121212] px-4 py-3 text-sm"
              >
                <span className="font-medium text-white">{l.name}</span>
                <span className="text-[#B3B3B3]">
                  {l.serviceType ? <span className="capitalize text-premium-gold">{l.serviceType}</span> : "—"}
                  {l.valueCents != null ? ` · value $${(l.valueCents / 100).toLocaleString()}` : ""}
                  {l.revenueCents != null ? ` · revenue $${(l.revenueCents / 100).toLocaleString()}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
