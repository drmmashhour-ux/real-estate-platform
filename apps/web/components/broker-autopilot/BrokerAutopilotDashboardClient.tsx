"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/** Matches GET /api/broker-autopilot/summary */
type Summary = {
  kpis: {
    newLeads: number;
    highPriority: number;
    followUpsDueToday: number;
    closedThisWeek: number;
  };
  suggestedActions: number;
  hotLeads: number;
  followUpsDueToday: number;
  overdueFollowups: number;
  newLeads: number;
};

type ActionRow = {
  id: string;
  title: string;
  reason: string;
  actionType: string;
  status: string;
  draftMessage: string | null;
  scheduledFor: string | null;
  lead: {
    id: string;
    guestName: string | null;
    guestEmail: string | null;
    customer: { name: string | null; email: string | null } | null;
    listing: { id: string; title: string; listingCode: string } | null;
  };
};

type Briefing = {
  id: string;
  summary: string;
  highPriorityCount: number;
  followupsDueCount: number;
  overdueCount: number;
  topActionsJson: unknown;
};

type Settings = {
  mode: string;
  autoDraftFollowups: boolean;
  autoSuggestVisits: boolean;
  autoPrioritizeHotLeads: boolean;
  dailyDigestEnabled: boolean;
  pauseUntil: string | null;
};

const STORAGE_PREFILL = "lecipm_autopilot_reply_prefill";

export function BrokerAutopilotDashboardClient() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pauseUntil, setPauseUntil] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, aRes, bGet, stRes] = await Promise.all([
        fetch("/api/broker-autopilot/summary", { credentials: "same-origin" }),
        fetch("/api/broker-autopilot/actions", { credentials: "same-origin" }),
        fetch("/api/broker-autopilot/daily-briefing", { credentials: "same-origin" }),
        fetch("/api/broker-autopilot/settings", { credentials: "same-origin" }),
      ]);
      const sJ = (await sRes.json()) as Partial<Summary> & { error?: string };
      const aJ = (await aRes.json()) as { actions?: ActionRow[]; error?: string };
      const bJ = (await bGet.json()) as { briefing?: Briefing | null; error?: string };
      const stJ = (await stRes.json()) as { settings?: Settings; error?: string };
      if (!sRes.ok) throw new Error(sJ.error ?? "Summary failed");
      if (!aRes.ok) throw new Error(aJ.error ?? "Actions failed");
      if (!stRes.ok) throw new Error(stJ.error ?? "Settings failed");
      setSummary({
        kpis: sJ.kpis ?? {
          newLeads: 0,
          highPriority: 0,
          followUpsDueToday: 0,
          closedThisWeek: 0,
        },
        suggestedActions: sJ.suggestedActions ?? 0,
        hotLeads: sJ.hotLeads ?? 0,
        followUpsDueToday: sJ.followUpsDueToday ?? 0,
        overdueFollowups: sJ.overdueFollowups ?? 0,
        newLeads: sJ.newLeads ?? sJ.kpis?.newLeads ?? 0,
      });
      setActions(Array.isArray(aJ.actions) ? aJ.actions : []);
      setBriefing(bJ.briefing ?? null);
      setSettings(stJ.settings ?? null);
      if (stJ.settings?.pauseUntil) {
        const d = new Date(stJ.settings.pauseUntil);
        if (!Number.isNaN(d.getTime())) {
          setPauseUntil(toDatetimeLocalValue(stJ.settings.pauseUntil));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function runScan() {
    setBusy("scan");
    setError(null);
    try {
      const res = await fetch("/api/broker-autopilot/scan", { method: "POST", credentials: "same-origin" });
      const j = (await res.json()) as { error?: string; created?: number };
      if (!res.ok) throw new Error(j.error ?? "Scan failed");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy(null);
    }
  }

  async function refreshBriefing() {
    setBusy("briefing");
    setError(null);
    try {
      const res = await fetch("/api/broker-autopilot/daily-briefing", {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as { briefing?: Briefing; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Briefing failed");
      setBriefing(j.briefing ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Briefing failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveSettings() {
    if (!settings) return;
    setBusy("settings");
    setError(null);
    try {
      const res = await fetch("/api/broker-autopilot/settings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: settings.mode,
          autoDraftFollowups: settings.autoDraftFollowups,
          autoSuggestVisits: settings.autoSuggestVisits,
          autoPrioritizeHotLeads: settings.autoPrioritizeHotLeads,
          dailyDigestEnabled: settings.dailyDigestEnabled,
          pauseUntil: pauseUntil.trim() ? new Date(pauseUntil).toISOString() : null,
        }),
      });
      const j = (await res.json()) as { settings?: Settings; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      if (j.settings) setSettings(j.settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function approveAction(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/broker-autopilot/actions/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Approve failed");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(null);
    }
  }

  async function dismissAction(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/broker-autopilot/actions/${encodeURIComponent(id)}/dismiss`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Dismiss failed");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dismiss failed");
    } finally {
      setBusy(null);
    }
  }

  async function snoozeTomorrow(id: string) {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    setBusy(id);
    try {
      const res = await fetch(`/api/broker-autopilot/actions/${encodeURIComponent(id)}/snooze`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ until }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Snooze failed");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Snooze failed");
    } finally {
      setBusy(null);
    }
  }

  async function openDraftInCrm(action: ActionRow) {
    if (action.status !== "approved" && action.status !== "queued") {
      setError("Approve this action first, then open the draft in CRM.");
      return;
    }
    setBusy(action.id);
    try {
      const res = await fetch(`/api/broker-autopilot/actions/${encodeURIComponent(action.id)}/execute`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as {
        error?: string;
        draftMessage?: string;
        leadId?: string;
        threadId?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Could not prepare draft");
      const draft = typeof j.draftMessage === "string" ? j.draftMessage : "";
      sessionStorage.setItem(
        STORAGE_PREFILL,
        JSON.stringify({
          leadId: action.lead.id,
          draft,
          actionId: action.id,
        })
      );
      router.push(`/dashboard/crm/${encodeURIComponent(action.lead.id)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Open failed");
    } finally {
      setBusy(null);
    }
  }

  const displayName = (a: ActionRow) =>
    a.lead.customer?.name?.trim() || a.lead.guestName || a.lead.customer?.email || "Lead";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          AI suggests next steps — you approve, edit, and send. Nothing sends automatically.
        </p>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => void runScan()}
          className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {busy === "scan" ? "Scanning…" : "Scan leads now"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}

      {summary ? (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Today&apos;s priorities</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Hot leads (high priority)", value: summary.hotLeads },
              { label: "Follow-ups due today", value: summary.followUpsDueToday },
              { label: "Overdue follow-ups", value: summary.overdueFollowups },
              { label: "Suggested actions", value: summary.suggestedActions },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{c.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Suggested actions</h2>
          <p className="text-xs text-slate-600">Approve → open in CRM → edit → send</p>
        </div>
        <ul className="mt-4 space-y-3">
          {actions.length === 0 && !loading ? (
            <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-slate-500">
              No open suggestions. Run a scan or check back after new lead activity.
            </li>
          ) : null}
          {actions.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-white/10 bg-black/30 p-4 shadow-sm shadow-black/20"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-white">{a.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{a.reason}</p>
                  <p className="mt-2 text-sm text-premium-gold">
                    <Link href={`/dashboard/crm/${a.lead.id}`} className="hover:underline">
                      {displayName(a)}
                    </Link>
                    {a.lead.listing ? (
                      <span className="text-slate-400">
                        {" "}
                        · {a.lead.listing.title.slice(0, 48)}
                        {a.lead.listing.title.length > 48 ? "…" : ""}
                      </span>
                    ) : null}
                  </p>
                  {a.draftMessage ? (
                    <p className="mt-2 line-clamp-3 rounded-lg bg-white/5 p-2 text-xs text-slate-400">
                      Draft: {a.draftMessage}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] uppercase text-slate-600">
                    {a.actionType} · {a.status}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  {a.status === "suggested" ? (
                    <button
                      type="button"
                      disabled={busy === a.id}
                      onClick={() => void approveAction(a.id)}
                      className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                  ) : null}
                  {(a.status === "approved" || a.status === "queued") && a.lead.id ? (
                    <button
                      type="button"
                      disabled={busy === a.id}
                      onClick={() => void openDraftInCrm(a)}
                      className="rounded-lg bg-premium-gold px-3 py-1.5 text-xs font-semibold text-black"
                    >
                      Open in CRM
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy === a.id}
                    onClick={() => void snoozeTomorrow(a.id)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                  >
                    Snooze 24h
                  </button>
                  <button
                    type="button"
                    disabled={busy === a.id}
                    onClick={() => void dismissAction(a.id)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-500 hover:bg-white/5"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-cyan-500/20 bg-cyan-950/15 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-cyan-100">Daily briefing</h2>
          <button
            type="button"
            disabled={busy === "briefing"}
            onClick={() => void refreshBriefing()}
            className="text-xs text-cyan-300 hover:underline"
          >
            Regenerate
          </button>
        </div>
        {briefing ? (
          <div className="mt-3 space-y-2 text-sm text-slate-200">
            <p className="whitespace-pre-wrap">{briefing.summary}</p>
            <p className="text-xs text-slate-500">
              High priority: {briefing.highPriorityCount} · Follow-ups due: {briefing.followupsDueCount} · Overdue:{" "}
              {briefing.overdueCount}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No briefing yet — regenerate to create today&apos;s digest.</p>
        )}
      </section>

      {settings ? (
        <section className="rounded-xl border border-white/10 p-4">
          <h2 className="text-sm font-semibold text-white">Autopilot settings</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs text-slate-500">
              Mode
              <select
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                value={settings.mode}
                onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
              >
                <option value="off">Off</option>
                <option value="assist">Assist (suggestions)</option>
                <option value="safe_autopilot">Safe autopilot</option>
                <option value="approval_required">Approval required</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={settings.autoDraftFollowups}
                onChange={(e) => setSettings({ ...settings, autoDraftFollowups: e.target.checked })}
              />
              Auto draft follow-ups (when scanning)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={settings.autoSuggestVisits}
                onChange={(e) => setSettings({ ...settings, autoSuggestVisits: e.target.checked })}
              />
              Suggest visits
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={settings.autoPrioritizeHotLeads}
                onChange={(e) => setSettings({ ...settings, autoPrioritizeHotLeads: e.target.checked })}
              />
              Prioritize hot leads
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={settings.dailyDigestEnabled}
                onChange={(e) => setSettings({ ...settings, dailyDigestEnabled: e.target.checked })}
              />
              Daily digest
            </label>
            <label className="block text-xs text-slate-500 sm:col-span-2">
              Pause until (local time)
              <input
                type="datetime-local"
                className="mt-1 w-full max-w-xs rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                value={pauseUntil}
                onChange={(e) => setPauseUntil(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busy === "settings"}
            onClick={() => void saveSettings()}
            className="mt-4 rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5"
          >
            Save settings
          </button>
        </section>
      ) : null}
    </div>
  );
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
