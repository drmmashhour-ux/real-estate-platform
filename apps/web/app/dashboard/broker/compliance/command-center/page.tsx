"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { REGULATOR_EXPORT_PROFILES } from "@/lib/compliance/regulator-exports";

type DashboardMetrics = {
  complaints: number;
  highRiskCases: number;
  trustIssues: number;
  reviewQueue: number;
  legalHolds: number;
};

type ComplianceAlertRow = {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  createdAt: string;
  acknowledged: boolean;
};

type ReviewQueueRow = {
  id: string;
  moduleKey: string;
  actionKey: string;
  priority: string;
  reason: string;
  status: string;
  createdAt: string;
};

type DashboardPayload = {
  success?: boolean;
  metrics: DashboardMetrics;
  alerts: ComplianceAlertRow[];
  reviewQueue: ReviewQueueRow[];
  executiveStatus: "NORMAL" | "ELEVATED" | "CRITICAL";
  executiveView?: {
    systemHealth: string;
    complianceGrade: string | null;
    readinessForInspection: string;
  };
  executiveRule: { highRiskThreshold: number; critical: boolean };
  guardrailEscalations30d: number;
  systemStatus?: "NORMAL" | "ELEVATED" | "CRITICAL";
  error?: string;
};

export default function ComplianceCommandCenterPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ackBusy, setAckBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compliance/dashboard", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerType: "solo_broker" }),
      });
      const json = (await res.json().catch(() => ({}))) as DashboardPayload & { error?: string };
      if (!res.ok || json.success === false) {
        setError(typeof json.error === "string" ? json.error : "Failed to load dashboard");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Network error");
      setData(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function acknowledgeAlert(id: string) {
    setAckBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/compliance/compliance-alerts/${encodeURIComponent(id)}/acknowledge`, {
        method: "POST",
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Ack failed");
        return;
      }
      await load();
    } finally {
      setAckBusy(null);
    }
  }

  const status = data?.executiveStatus ?? data?.systemStatus ?? "NORMAL";
  const statusColor =
    status === "CRITICAL" ? "text-red-400" : status === "ELEVATED" ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="space-y-8 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#D4AF37]">Compliance command center</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/70">
            Executive cockpit: live metrics, acknowledgeable alerts, and cross-module drill-downs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={busy}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/90 disabled:opacity-50"
        >
          {busy ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/dashboard/broker/complaints" className="text-[#D4AF37] underline-offset-2 hover:underline">
          Complaints
        </Link>
        <Link
          href="/dashboard/broker/compliance/review-queue"
          className="text-[#D4AF37] underline-offset-2 hover:underline"
        >
          Review queue
        </Link>
        <Link href="/dashboard/broker/compliance/audit" className="text-[#D4AF37] underline-offset-2 hover:underline">
          Audit
        </Link>
        <Link
          href="/dashboard/broker/compliance/advanced-ops"
          className="text-[#D4AF37] underline-offset-2 hover:underline"
        >
          Reports
        </Link>
        <Link
          href="/dashboard/broker/compliance/retention"
          className="text-[#D4AF37] underline-offset-2 hover:underline"
        >
          Retention
        </Link>
      </nav>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {data ? (
        <>
          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold text-[#D4AF37]">Executive view</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/45">System health</p>
                <p className={`mt-1 font-medium ${statusColor}`}>
                  {data.executiveView?.systemHealth ?? status}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/45">Compliance grade</p>
                <p className="mt-1 font-medium text-white">
                  {data.executiveView?.complianceGrade ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/45">Inspection readiness</p>
                <p className="mt-1 text-white/85">{data.executiveView?.readinessForInspection ?? "—"}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
              <span>Executive status</span>
              <span className={`font-semibold ${statusColor}`}>{status}</span>
              {data.executiveRule.critical ? (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-200">
                  Critical risk events &gt; {data.executiveRule.highRiskThreshold}
                </span>
              ) : null}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <MetricCard label="Complaints" value={data.metrics.complaints} />
            <MetricCard label="High risk" value={data.metrics.highRiskCases} />
            <MetricCard label="Trust issues" value={data.metrics.trustIssues} />
            <MetricCard label="Review queue" value={data.metrics.reviewQueue} />
            <MetricCard label="Legal holds" value={data.metrics.legalHolds} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="Guardrail escalations (30d)" value={data.guardrailEscalations30d} />
            <MetricCard label="Open cockpit alerts" value={data.alerts.length} />
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-[#D4AF37]">Alerts</h2>
            <div className="space-y-2">
              {data.alerts.length === 0 ? (
                <p className="text-sm text-white/50">No unacknowledged cockpit alerts.</p>
              ) : (
                data.alerts.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wide text-white/50">
                        {a.alertType} · {a.severity}
                      </p>
                      <p className="mt-1 font-medium text-white">{a.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">{a.description}</p>
                      <p className="mt-2 text-xs text-white/40">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      disabled={ackBusy === a.id}
                      onClick={() => void acknowledgeAlert(a.id)}
                      className="shrink-0 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                    >
                      {ackBusy === a.id ? "…" : "Acknowledge"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-[#D4AF37]">Review queue (open)</h2>
            <ul className="space-y-2 text-sm">
              {data.reviewQueue.length === 0 ? (
                <li className="text-white/50">Queue empty.</li>
              ) : (
                data.reviewQueue.map((q) => (
                  <li key={q.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-white/60">{q.moduleKey}</span> · {q.actionKey}{" "}
                    <span className="text-white/40">({q.priority})</span>
                    <p className="text-white/80">{q.reason}</p>
                  </li>
                ))
              )}
            </ul>
            <Link
              href="/dashboard/broker/compliance/review-queue"
              className="inline-block text-sm text-[#D4AF37] underline-offset-2 hover:underline"
            >
              Open full review queue
            </Link>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-[#D4AF37]">Quick actions</h2>
            <div className="flex flex-wrap gap-2">
              <QuickAction
                label="Generate regulator report"
                onClick={async () => {
                  setBusy(true);
                  try {
                    const res = await fetch("/api/compliance/reports/generate", {
                      method: "POST",
                      credentials: "same-origin",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ownerType: "solo_broker" }),
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setError(typeof json.error === "string" ? json.error : "Report failed");
                      return;
                    }
                    setError(null);
                    alert(`Report bundle ${json.report?.bundleNumber ?? ""} generated. Seal when final.`);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              <Link
                href="/dashboard/broker/compliance/health"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/90"
              >
                Compliance health & scoring
              </Link>
              <Link
                href="/dashboard/broker/compliance/inspection"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/90"
              >
                Inspection mode
              </Link>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-[#D4AF37]">Export profiles</h2>
            <ul className="list-inside list-disc text-sm text-white/75">
              {Object.entries(REGULATOR_EXPORT_PROFILES).map(([key, v]) => (
                <li key={key}>
                  <span className="font-medium text-white/90">{v.label}</span> ({key}) — modules:{" "}
                  {v.defaultModules.join(", ")}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : !busy ? (
        <p className="text-sm text-white/50">No data.</p>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void | Promise<void> }) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black"
    >
      {label}
    </button>
  );
}
