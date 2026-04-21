"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { Card } from "@/components/lecipm-ui/card";

type Payload = {
  cases: {
    id: string;
    caseType: string;
    severity: string;
    status: string;
    summary: string;
    createdAt: string;
  }[];
  auditLogs: {
    id: string;
    actionKey: string;
    createdAt: string;
    caseId: string | null;
  }[];
  insuranceLeads: {
    id: string;
    email: string;
    fullName: string | null;
    status: string;
    leadScore: number;
    createdAt: string;
  }[];
};

export function ComplianceConsoleClient({ localeCountryPrefix }: { localeCountryPrefix: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compliance", { credentials: "same-origin" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body?.error === "string" ? body.error : `HTTP ${res.status}`);
      }
      setData((await res.json()) as Payload);
    } catch (e) {
      console.error("[ComplianceConsoleClient]", e);
      setError(e instanceof Error ? e.message : "Failed to load compliance");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Compliance</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-gold/40 hover:text-gold"
          >
            Refresh
          </button>
          <Link
            href={`${localeCountryPrefix}/dashboard/compliance`}
            className="rounded-lg border border-gold/35 px-3 py-1.5 text-sm text-gold hover:bg-gold/10"
          >
            Full dashboard
          </Link>
        </div>
      </div>

      {loading ? (
        <Card className="animate-pulse text-neutral-500">Loading compliance…</Card>
      ) : error ? (
        <Card className="border-red-900/60 bg-red-950/40 text-red-100">{error}</Card>
      ) : !data ? (
        <Card className="text-neutral-400">No data.</Card>
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gold">Cases</h2>
            <div className="space-y-2">
              {data.cases.length === 0 ? (
                <Card className="text-neutral-500">No open compliance cases in scope.</Card>
              ) : (
                data.cases.map((c) => (
                  <Card key={c.id} className="text-sm">
                    <p className="font-medium text-white">{c.caseType}</p>
                    <p className="mt-1 text-neutral-400">{c.summary.slice(0, 220)}{c.summary.length > 220 ? "…" : ""}</p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {c.severity} · {c.status} · {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gold">Audit trail</h2>
            <div className="space-y-2">
              {data.auditLogs.length === 0 ? (
                <Card className="text-neutral-500">No audit entries.</Card>
              ) : (
                data.auditLogs.map((a) => (
                  <div key={a.id} className="rounded-lg bg-[#111111] px-3 py-2 text-sm text-neutral-300">
                    <span className="text-gold">{a.actionKey}</span>
                    {a.caseId ? <span className="ml-2 text-neutral-500">case {a.caseId.slice(0, 8)}…</span> : null}
                    <span className="ml-2 text-xs text-neutral-600">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gold">Insurance leads</h2>
            <div className="space-y-2">
              {data.insuranceLeads.length === 0 ? (
                <Card className="text-neutral-500">No insurance leads in scope.</Card>
              ) : (
                data.insuranceLeads.map((l) => (
                  <div key={l.id} className="rounded-lg bg-[#111111] px-3 py-2 text-sm">
                    <span className="text-neutral-200">{l.fullName ?? l.email}</span>
                    <span className="ml-2 text-neutral-500">
                      · {l.status} · score {l.leadScore}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
