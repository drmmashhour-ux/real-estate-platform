"use client";

import { useState } from "react";

export function ExecutionBridgePanel({ dealId, formKey }: { dealId: string; formKey: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function session() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/execution-bridge/session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(data.message ?? JSON.stringify(data));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function exportPayload() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/execution-bridge/export/${encodeURIComponent(formKey)}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brokerApprovalState: "draft", providerMode: "broker_manual" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(data.providerMessage ?? data.export?.executionReadinessStatus ?? "ok");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-ds-border/60 bg-black/35 p-4">
      <h4 className="text-sm font-medium text-ds-text">Execution bridge (draft)</h4>
      <p className="mt-1 text-xs text-ds-text-secondary">
        Creates audit-backed session / export payloads for manual transfer — does not execute official forms.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void session()}
          className="rounded-lg border border-ds-gold/40 bg-black/50 px-3 py-1.5 text-xs text-ds-gold"
        >
          Create session
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void exportPayload()}
          className="rounded-lg bg-ds-gold/90 px-3 py-1.5 text-xs font-medium text-black"
        >
          Build export payload
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs text-ds-text-secondary">{msg}</p> : null}
    </div>
  );
}
