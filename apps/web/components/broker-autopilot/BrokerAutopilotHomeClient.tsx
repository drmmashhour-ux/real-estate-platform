"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Settings = {
  mode: string;
  autoDraftFollowups: boolean;
  autoSuggestVisits: boolean;
  autoPrioritizeHotLeads: boolean;
  dailyDigestEnabled: boolean;
  pauseUntil: string | null;
};

type ActionRow = {
  id: string;
  actionType: string;
  status: string;
  title: string;
  reason: string;
  draftMessage: string | null;
  lead: {
    id: string;
    guestName: string | null;
    listing: { id: string; title: string; listingCode: string } | null;
    customer: { name: string | null; email: string | null } | null;
  };
};

type Briefing = {
  summary: string;
  highPriorityCount: number;
  followupsDueCount: number;
  overdueCount: number;
  topActionsJson: unknown;
};

export function BrokerAutopilotHomeClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [priorities, setPriorities] = useState<{
    hotLeads: number;
    followUpsDueToday: number;
    overdueFollowups: number;
    newLeads: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);
  const [snoozeUntil, setSnoozeUntil] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, a, b, sum] = await Promise.all([
        fetch("/api/broker-autopilot/settings", { credentials: "same-origin" }).then((r) => r.json()),
        fetch("/api/broker-autopilot/actions", { credentials: "same-origin" }).then((r) => r.json()),
        fetch("/api/broker-autopilot/daily-briefing", { credentials: "same-origin" }).then((r) => r.json()),
        fetch("/api/broker-autopilot/summary", { credentials: "same-origin" }).then((r) => r.json()),
      ]);
      if (s.settings) setSettings(s.settings as Settings);
      setActions(Array.isArray(a.actions) ? a.actions : []);
      setBriefing((b.briefing as Briefing) ?? null);
      if (sum && !sum.error) {
        setPriorities({
          hotLeads: sum.hotLeads ?? 0,
          followUpsDueToday: sum.followUpsDueToday ?? 0,
          overdueFollowups: sum.overdueFollowups ?? 0,
          newLeads: sum.newLeads ?? sum.kpis?.newLeads ?? 0,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function postJson(url: string, body?: object) {
    const res = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(j.error ?? "Request failed");
    return j;
  }

  if (loading) return <p className="text-sm text-slate-500">Loading autopilot…</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Assistive autopilot — suggestions only. Nothing sends without your review.{" "}
          <span className="text-slate-500">AI outputs are labeled and editable.</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!busy}
            onClick={async () => {
              setBusy("scan");
              try {
                await postJson("/api/broker-autopilot/scan");
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Scan failed");
              } finally {
                setBusy(null);
              }
            }}
            className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            {busy === "scan" ? "Scanning…" : "Scan leads now"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={async () => {
              setBusy("brief");
              try {
                await postJson("/api/broker-autopilot/daily-briefing");
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Briefing failed");
              } finally {
                setBusy(null);
              }
            }}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5"
          >
            Refresh daily briefing
          </button>
        </div>
      </div>

      {priorities ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Hot leads (priority)", value: priorities.hotLeads },
            { label: "Follow-ups due today", value: priorities.followUpsDueToday },
            { label: "Overdue follow-ups", value: priorities.overdueFollowups },
            { label: "New leads", value: priorities.newLeads },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{c.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <section className="rounded-xl border border-violet-500/25 bg-violet-950/20 p-4">
        <h2 className="text-sm font-semibold text-violet-100">Today&apos;s briefing</h2>
        {briefing ? (
          <>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{briefing.summary}</p>
            <p className="mt-2 text-xs text-slate-500">
              High priority: {briefing.highPriorityCount} · Follow-ups due: {briefing.followupsDueCount} · Overdue:{" "}
              {briefing.overdueCount}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No briefing yet — run refresh or open the dashboard tomorrow.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Suggested actions</h2>
        {actions.length === 0 ? (
          <p className="text-sm text-slate-500">No open suggestions. Run a scan after new inquiries arrive.</p>
        ) : (
          <ul className="space-y-3">
            {actions.map((a) => {
              const name =
                a.lead.customer?.name?.trim() || a.lead.guestName || a.lead.customer?.email || "Lead";
              const listingLabel = a.lead.listing?.title ?? a.lead.listing?.listingCode ?? "—";
              return (
                <li
                  key={a.id}
                  className="rounded-xl border border-white/10 bg-black/30 p-4 shadow-sm shadow-black/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{a.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {name} · {listingLabel}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">{a.reason}</p>
                      {a.draftMessage ? (
                        <p className="mt-2 rounded-lg border border-dashed border-white/15 bg-black/40 p-2 text-xs text-slate-400">
                          <span className="font-medium text-amber-200/90">AI draft (editable):</span> {a.draftMessage}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                        {a.actionType.replace(/_/g, " ")}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/crm/${a.lead.id}`}
                          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/5"
                        >
                          Open lead
                        </Link>
                        {a.status === "suggested" ? (
                          <button
                            type="button"
                            disabled={!!busy}
                            onClick={async () => {
                              setBusy(`ap-${a.id}`);
                              try {
                                await postJson(`/api/broker-autopilot/actions/${encodeURIComponent(a.id)}/approve`);
                                await load();
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Failed");
                              } finally {
                                setBusy(null);
                              }
                            }}
                            className="rounded-lg bg-emerald-600/40 px-3 py-1.5 text-xs font-medium text-emerald-50"
                          >
                            Approve
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={!!busy}
                          onClick={async () => {
                            setBusy(`di-${a.id}`);
                            try {
                              await postJson(`/api/broker-autopilot/actions/${encodeURIComponent(a.id)}/dismiss`);
                              await load();
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Failed");
                            } finally {
                              setBusy(null);
                            }
                          }}
                          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-200"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          disabled={!!busy}
                          onClick={() => {
                            setSnoozeId(a.id);
                            setSnoozeUntil("");
                          }}
                          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                        >
                          Snooze
                        </button>
                        {a.status === "approved" || a.status === "queued" ? (
                          <button
                            type="button"
                            disabled={!!busy}
                            onClick={async () => {
                              setBusy(`ex-${a.id}`);
                              try {
                                const res = await fetch(
                                  `/api/broker-autopilot/actions/${encodeURIComponent(a.id)}/execute`,
                                  { method: "POST", credentials: "same-origin" }
                                );
                                const j = (await res.json()) as {
                                  threadId?: string;
                                  leadId?: string;
                                  draftMessage?: string;
                                  error?: string;
                                };
                                if (!res.ok) throw new Error(j.error ?? "Failed");
                                const q = new URLSearchParams();
                                if (j.draftMessage) q.set("draft", j.draftMessage);
                                q.set("actionId", a.id);
                                window.location.href = `/dashboard/crm/${j.leadId ?? a.lead.id}?${q.toString()}`;
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Failed");
                              } finally {
                                setBusy(null);
                              }
                            }}
                            className="rounded-lg bg-premium-gold px-3 py-1.5 text-xs font-semibold text-black"
                          >
                            Open composer
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {snoozeId === a.id ? (
                    <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-white/10 pt-3">
                      <div>
                        <label className="text-[10px] text-slate-500">Snooze until</label>
                        <input
                          type="datetime-local"
                          className="mt-1 rounded border border-white/15 bg-black/50 px-2 py-1 text-xs text-white"
                          value={snoozeUntil}
                          onChange={(e) => setSnoozeUntil(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!snoozeUntil}
                        onClick={async () => {
                          setBusy("snz");
                          try {
                            await postJson(`/api/broker-autopilot/actions/${encodeURIComponent(a.id)}/snooze`, {
                              until: new Date(snoozeUntil).toISOString(),
                            });
                            setSnoozeId(null);
                            await load();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Failed");
                          } finally {
                            setBusy(null);
                          }
                        }}
                        className="rounded-lg bg-white/15 px-3 py-1.5 text-xs"
                      >
                        Save snooze
                      </button>
                      <button type="button" onClick={() => setSnoozeId(null)} className="text-xs text-slate-500">
                        Cancel
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-white/10 p-4">
        <h2 className="text-sm font-semibold text-white">Autopilot settings</h2>
        {settings ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-xs text-slate-400">
              Mode
              <select
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                value={settings.mode}
                disabled={!!busy}
                onChange={async (e) => {
                  setBusy("set");
                  try {
                    await postJson("/api/broker-autopilot/settings", { mode: e.target.value });
                    await load();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed");
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                <option value="off">Off</option>
                <option value="assist">Assist (default)</option>
                <option value="safe_autopilot">Safe autopilot</option>
                <option value="approval_required">Approval required</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={settings.autoDraftFollowups}
                disabled={!!busy}
                onChange={async (e) => {
                  setBusy("set");
                  try {
                    await postJson("/api/broker-autopilot/settings", { autoDraftFollowups: e.target.checked });
                    await load();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed");
                  } finally {
                    setBusy(null);
                  }
                }}
              />
              Auto-generate follow-up drafts (still editable)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={settings.autoSuggestVisits}
                disabled={!!busy}
                onChange={async (e) => {
                  setBusy("set");
                  try {
                    await postJson("/api/broker-autopilot/settings", { autoSuggestVisits: e.target.checked });
                    await load();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed");
                  } finally {
                    setBusy(null);
                  }
                }}
              />
              Suggest visit scheduling
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={settings.dailyDigestEnabled}
                disabled={!!busy}
                onChange={async (e) => {
                  setBusy("set");
                  try {
                    await postJson("/api/broker-autopilot/settings", { dailyDigestEnabled: e.target.checked });
                    await load();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed");
                  } finally {
                    setBusy(null);
                  }
                }}
              />
              Daily digest / briefing
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={settings.autoPrioritizeHotLeads}
                disabled={!!busy}
                onChange={async (e) => {
                  setBusy("set");
                  try {
                    await postJson("/api/broker-autopilot/settings", {
                      autoPrioritizeHotLeads: e.target.checked,
                    });
                    await load();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed");
                  } finally {
                    setBusy(null);
                  }
                }}
              />
              Prioritize hot leads in scans
            </label>
            <label className="block text-xs text-slate-400 md:col-span-2">
              Pause until (optional)
              <input
                type="datetime-local"
                className="mt-1 w-full max-w-xs rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                value={
                  settings.pauseUntil
                    ? new Date(settings.pauseUntil).toISOString().slice(0, 16)
                    : ""
                }
                onChange={async (e) => {
                  const v = e.target.value;
                  setBusy("set");
                  try {
                    await postJson("/api/broker-autopilot/settings", {
                      pauseUntil: v ? new Date(v).toISOString() : null,
                    });
                    await load();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed");
                  } finally {
                    setBusy(null);
                  }
                }}
              />
            </label>
          </div>
        ) : null}
        <p className="mt-4 text-xs text-slate-500">
          Email digest: not wired in MVP — in-app briefing only. Future: optional provider hook.
        </p>
      </section>
    </div>
  );
}
