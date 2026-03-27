"use client";

import { useState, useEffect } from "react";

const AI_REFILL_EVENT = "admin-form-ai-refill-apply";

type Flag = { id: string; key: string; enabled: boolean; scope: string; scopeValue: string | null; reason: string | null };
type Control = { id: string; controlType: string; targetType: string; targetId: string | null; active: boolean; reason: string | null; reasonCode: string | null };
type Audit = { id: string; action: string; performedBy: string | null; reasonCode: string | null; createdAt: Date | string };

export function ControlsDashboardClient({
  initialFlags,
  initialControls,
  initialAuditLog,
}: {
  initialFlags: Flag[];
  initialControls: Control[];
  initialAuditLog: Audit[];
}) {
  const [flags, setFlags] = useState(initialFlags);
  const [controls] = useState(initialControls);
  const [auditLog] = useState(initialAuditLog);
  const [newFlagKey, setNewFlagKey] = useState("");
  const [newFlagReason, setNewFlagReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ formId: string; suggestions: { newFlagKey?: string; newFlagReason?: string } }>;
      if (ev.detail?.formId === "controls" && ev.detail?.suggestions) {
        const s = ev.detail.suggestions;
        if (s.newFlagKey) setNewFlagKey(s.newFlagKey);
        if (s.newFlagReason) setNewFlagReason(s.newFlagReason);
      }
    };
    window.addEventListener(AI_REFILL_EVENT, handler);
    return () => window.removeEventListener(AI_REFILL_EVENT, handler);
  }, []);

  async function toggleFlag(key: string, enabled: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        key,
        enabled,
        reason:
          (key === newFlagKey && newFlagReason.trim())
            ? newFlagReason.trim()
            : (enabled ? "Enabled from controls" : "Disabled from controls"),
      }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFlags((prev) => {
          const i = prev.findIndex((f) => f.key === key);
          if (i >= 0) return prev.map((f, j) => (j === i ? { ...f, enabled: updated.enabled } : f));
          return [...prev, { id: updated.id, key: updated.key, enabled: updated.enabled, scope: updated.scope, scopeValue: updated.scopeValue, reason: updated.reason }];
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Feature flags</h2>
        <p className="mt-1 text-sm text-slate-500">Kill switches for risky flows (e.g. instant_booking).</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="New flag key"
            value={newFlagKey}
            onChange={(e) => setNewFlagKey(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={newFlagReason}
            onChange={(e) => setNewFlagReason(e.target.value)}
            className="min-w-[200px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <button
            type="button"
            onClick={() => {
              if (newFlagKey.trim()) {
                toggleFlag(newFlagKey.trim(), true);
                setNewFlagKey("");
              }
            }}
            disabled={saving}
            className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            Add & enable
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {flags.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-lg border border-slate-700/60 px-3 py-2">
              <span className="font-mono text-sm text-slate-300">{f.key}</span>
              <span className="text-xs text-slate-500">{f.scope}{f.scopeValue ? `: ${f.scopeValue}` : ""}</span>
              <button
                type="button"
                onClick={() => toggleFlag(f.key, !f.enabled)}
                disabled={saving}
                className={`rounded px-2 py-1 text-xs font-medium ${f.enabled ? "bg-amber-500/20 text-amber-300" : "bg-slate-700 text-slate-400"}`}
              >
                {f.enabled ? "ON" : "OFF"}
              </button>
            </li>
          ))}
          {flags.length === 0 && <li className="text-sm text-slate-500">No feature flags yet.</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Active operational controls</h2>
        <p className="mt-1 text-sm text-slate-500">Payout holds, listing freezes, booking restrictions. Create via API or extend this UI.</p>
        <ul className="mt-4 space-y-2">
          {controls.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-2 text-sm">
              <span className="font-medium text-slate-300">{c.controlType}</span>
              <span className="text-slate-500">{c.targetType}{c.targetId ? `: ${c.targetId}` : ""}</span>
              {c.reason && <span className="text-slate-500">— {c.reason}</span>}
            </li>
          ))}
          {controls.length === 0 && <li className="text-sm text-slate-500">No active controls.</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Control action audit log</h2>
        <ul className="mt-4 space-y-1 text-sm">
          {auditLog.map((a) => (
            <li key={a.id} className="flex flex-wrap gap-2 text-slate-400">
              <span className="text-slate-500">{new Date(a.createdAt as string).toLocaleString()}</span>
              <span className="font-medium text-slate-300">{a.action}</span>
              {a.performedBy && <span>by {a.performedBy}</span>}
              {a.reasonCode && <span>({a.reasonCode})</span>}
            </li>
          ))}
          {auditLog.length === 0 && <li className="text-slate-500">No audit entries yet.</li>}
        </ul>
      </section>
    </div>
  );
}
