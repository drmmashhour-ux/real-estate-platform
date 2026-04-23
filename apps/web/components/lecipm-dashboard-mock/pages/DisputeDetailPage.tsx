"use client";

import { useCallback, useEffect, useState } from "react";

import { Link } from "@/i18n/navigation";

import { MockBadge, MockButton, MockCard } from "@/components/lecipm-dashboard-mock/mock-ui";

import type { UnifiedTimelineRow } from "@/modules/disputes/dispute.types";

type DetailPayload = {
  dispute: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    relatedEntityType: string;
    relatedEntityId: string;
    resolutionNotes?: string | null;
    aiAssistSummary?: string | null;
    messages: Array<{ id: string; message: string; createdAt: string; attachments: unknown }>;
  };
  timeline: UnifiedTimelineRow[];
  relatedLabel?: { label: string };
  compliance?: { footer: string };
};

const LIFECYCLE = ["OPEN", "IN_REVIEW", "ESCALATED", "RESOLVED"] as const;

function statusTone(s: string): Parameters<typeof MockBadge>[0]["tone"] {
  switch (s) {
    case "OPEN":
      return "dispute-open";
    case "IN_REVIEW":
      return "dispute-review";
    case "ESCALATED":
      return "dispute-escalated";
    case "RESOLVED":
      return "dispute-resolved";
    case "REJECTED":
      return "dispute-rejected";
    default:
      return "muted";
  }
}

function lifecycleIndex(s: string): number {
  if (s === "REJECTED") return 3;
  const i = LIFECYCLE.indexOf(s as (typeof LIFECYCLE)[number]);
  return i >= 0 ? i : 0;
}

export function DisputeDetailPage(props: { disputeId: string }) {
  const [data, setData] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [assist, setAssist] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/disputes/${props.disputeId}`, { credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as DetailPayload & { error?: string };
      if (!res.ok) {
        setError(j?.error ?? "load_failed");
        setData(null);
        return;
      }
      setData(j);
    } catch {
      setError("network_error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [props.disputeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const severityScore =
    data?.dispute.priority === "HIGH" ? 92 : data?.dispute.priority === "MEDIUM" ? 68 : 44;

  async function sendMessage() {
    if (!msg.trim()) return;
    const res = await fetch(`/api/disputes/${props.disputeId}/message`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    if (res.ok) {
      setMsg("");
      await load();
    }
  }

  async function runAssist() {
    const res = await fetch(`/api/disputes/${props.disputeId}/assist`, {
      method: "POST",
      credentials: "include",
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) setAssist(j);
  }

  async function escalate() {
    await fetch(`/api/disputes/${props.disputeId}/escalate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Escalated from Dispute Room UI" }),
    });
    await load();
  }

  if (loading) {
    return <p className="text-sm text-ds-text-secondary">Loading case…</p>;
  }
  if (error || !data?.dispute) {
    return (
      <p className="rounded-xl border border-red-500/35 bg-red-950/30 px-4 py-3 text-sm text-red-100">
        {error ?? "not_found"}
      </p>
    );
  }

  const d = data.dispute;
  const li = lifecycleIndex(d.status);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Link href="/design/lecipm-dashboard/disputes" className="text-xs font-medium text-ds-gold hover:underline">
        ← Disputes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Dispute case</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{d.title}</h1>
          <p className="mt-2 text-sm text-ds-text-secondary">{data.relatedLabel?.label ?? `${d.relatedEntityType} · ${d.relatedEntityId}`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MockBadge tone={statusTone(d.status)}>{d.status}</MockBadge>
          <MockBadge tone={d.priority === "HIGH" ? "gold" : "muted"}>{d.priority}</MockBadge>
          <MockBadge tone="muted">{d.category}</MockBadge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MockCard>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Severity index</p>
          <p className="mt-3 text-4xl font-bold text-ds-gold">{severityScore}</p>
          <p className="mt-2 text-xs text-ds-text-secondary">Heuristic from priority + status — not a legal score.</p>
        </MockCard>
        <MockCard>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Summary</p>
          <p className="mt-3 text-sm leading-relaxed text-white">{d.description}</p>
          {d.resolutionNotes ?
            <p className="mt-4 border-t border-ds-border pt-4 text-sm text-ds-text-secondary">
              Resolution notes · {d.resolutionNotes}
            </p>
          : null}
        </MockCard>
      </div>

      <MockCard>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Lifecycle</p>
        <ol className="mt-4 flex flex-wrap gap-2">
          {LIFECYCLE.map((stage, i) => (
            <li
              key={stage}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide ${
                i <= li ?
                  "border-ds-gold/45 bg-ds-gold/10 text-ds-gold shadow-[0_0_16px_rgba(212,175,55,0.12)]"
                : "border-ds-border text-ds-text-secondary"
              }`}
            >
              {stage === "RESOLVED" && d.status === "REJECTED" ? "REJECTED" : stage}
            </li>
          ))}
        </ol>
      </MockCard>

      <MockCard>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Unified timeline</p>
        <ul className="mt-4 space-y-3">
          {data.timeline.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-ds-border bg-black/40 px-3 py-2 text-sm text-ds-text-secondary"
            >
              <span className="text-[10px] uppercase tracking-wide text-ds-gold/90">{t.channel}</span>
              <p className="text-white">{t.label}</p>
              <p className="text-xs">{t.detail}</p>
              <p className="mt-1 text-[10px] opacity-80">{new Date(t.at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </MockCard>

      <MockCard>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Messages</p>
        <div className="mt-4 max-h-72 space-y-3 overflow-y-auto">
          {d.messages.map((m) => (
            <div key={m.id} className="rounded-lg border border-ds-border/60 bg-black/50 px-3 py-2 text-sm text-white">
              {m.message}
              <p className="mt-1 text-[10px] text-ds-text-secondary">{new Date(m.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-ds-border bg-black/60 px-3 py-2 text-sm text-white"
            placeholder="Add a neutral, factual update…"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <MockButton onClick={() => void sendMessage()}>Send</MockButton>
        </div>
      </MockCard>

      <MockCard>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Evidence</p>
        <p className="mt-2 text-xs text-ds-text-secondary">
          References stored on messages (document IDs / URLs). Upload via your standard document flow, then paste references
          in messages if needed.
        </p>
      </MockCard>

      <MockCard>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Actions</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <MockButton variant="ghost" onClick={() => void escalate()}>
            Escalate for arbitration
          </MockButton>
          <MockButton variant="ghost" onClick={() => void runAssist()}>
            Assistive summary (AI)
          </MockButton>
          <Link
            href="/dashboard/admin/disputes"
            className="inline-flex items-center justify-center rounded-lg border border-ds-border bg-transparent px-4 py-2.5 text-sm font-semibold text-ds-text transition-all duration-200 hover:border-ds-gold/50 hover:text-ds-gold"
          >
            Admin console
          </Link>
        </div>
        {assist ?
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-ds-border bg-black/50 p-3 text-[11px] text-ds-text-secondary">
            {JSON.stringify(assist, null, 2)}
          </pre>
        : null}
        {d.aiAssistSummary ?
          <p className="mt-4 text-xs text-ds-text-secondary">Stored assist summary: {d.aiAssistSummary.slice(0, 280)}…</p>
        : null}
      </MockCard>

      {data.compliance?.footer ?
        <p className="text-[11px] leading-relaxed text-ds-text-secondary">{data.compliance.footer}</p>
      : null}
    </div>
  );
}
