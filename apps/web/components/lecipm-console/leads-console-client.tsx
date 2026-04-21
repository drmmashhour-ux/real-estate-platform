"use client";

import { useCallback, useEffect, useState } from "react";

import { Card } from "@/components/lecipm-ui/card";

type LeadRow = {
  id: string;
  email?: string;
  leadSource?: string | null;
  distributionChannel?: string | null;
  pipelineStatus?: string;
  name?: string;
};

export function LeadsConsoleClient() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", { credentials: "same-origin" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body?.error === "string" ? body.error : `HTTP ${res.status}`);
      }
      const data = (await res.json()) as unknown;
      const list = Array.isArray(data) ? data : [];
      setLeads(list as LeadRow[]);
    } catch (e) {
      console.error("[LeadsConsoleClient]", e);
      setError(e instanceof Error ? e.message : "Failed to load leads");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function sourceLabel(lead: LeadRow) {
    const s = lead.distributionChannel ?? lead.leadSource;
    return s?.trim().length ? s : "—";
  }

  return (
    <div className="space-y-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Leads</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-gold/40 hover:text-gold"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <Card className="animate-pulse text-neutral-500">Loading leads…</Card>
      ) : error ? (
        <Card className="border-red-900/60 bg-red-950/40 text-red-100">
          <p className="font-medium">Could not load leads</p>
          <p className="mt-1 text-sm opacity-90">{error}</p>
        </Card>
      ) : leads.length === 0 ? (
        <Card className="text-neutral-400">No leads yet — connect funnel events or CRM imports.</Card>
      ) : (
        leads.map((lead) => (
          <div key={lead.id} className="rounded-lg bg-[#111111] p-3 text-sm">
            <span className="text-neutral-400">{lead.email ?? lead.name ?? lead.id}</span>
            {" — "}
            <span className="text-gold">{sourceLabel(lead)}</span>
            {lead.pipelineStatus ? (
              <span className="ml-2 text-neutral-500"> · {lead.pipelineStatus}</span>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
