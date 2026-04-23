"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminCommandBar } from "@/components/admin/AdminCommandBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type SummaryPayload = {
  advisory?: string;
  generatedAt?: string;
  globalPause?: { paused: boolean; pausedById?: string | null; reason?: string | null };
  modeOverview?: Array<{
    domain: string;
    effectiveMode: string;
    killSwitch: string;
    riskLevel: string;
    boundedFullAutopilotEligible?: boolean;
    gatedHighRisk?: boolean;
    reason?: string;
  }>;
  liveFeed?: {
    automatic: unknown[];
    queuedApprovals: unknown[];
    blocked: unknown[];
  };
  approvals?: Array<{
    id: string;
    executionId?: string | null;
    domain: string;
    actionType: string;
    explanation: string;
    riskLevel: string;
    status: string;
  }>;
  measurementNotes?: {
    revenueConversionAdvisory?: string;
    roiSnapshot?: { linkedRows?: number; note?: string };
    operatorWidgets?: {
      rollbacksToday?: number;
      estimatedMinutesSaved7d?: number;
      outcomeLinkedExecutions7d?: number;
    };
  };
  outcomeMetrics?: {
    totalExecutions: number;
    allowCount: number;
    requireApprovalCount: number;
    blockCount: number;
    successRate: number;
    rollbackCount: number;
  };
  alerts?: Array<{ severity: string; title: string; detail: string }>;
  rollbackCandidates?: Array<{ id: string; domain: string; actionType: string }>;
  recommendations?: Array<{ domain: string; currentMode: string; recommendedMode: string; changeUrgency: string; explanation: string }>;
};

export default function FullAutopilotControlCenterPage() {
  const [data, setData] = useState<SummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/full-autopilot/summary");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.error === "string" ? j.error : "summary_failed");
        return;
      }
      setData(j as SummaryPayload);
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredModes = useMemo(() => {
    const rows = data?.modeOverview ?? [];
    return rows.filter((r) => {
      if (domainFilter && !r.domain.includes(domainFilter)) return false;
      if (riskFilter !== "all" && r.riskLevel !== riskFilter) return false;
      return true;
    });
  }, [data?.modeOverview, domainFilter, riskFilter]);

  async function pauseAll(paused: boolean) {
    await fetch("/api/full-autopilot/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused, reason: paused ? "operator_pause_all" : "operator_resume_all" }),
    });
    await load();
  }

  async function approveRow(id: string) {
    await fetch(`/api/full-autopilot/approvals/${id}/approve`, { method: "POST" });
    await load();
  }

  async function rejectRow(id: string) {
    await fetch(`/api/full-autopilot/approvals/${id}/reject`, { method: "POST" });
    await load();
  }

  async function rollbackExec(id: string) {
    await fetch(`/api/full-autopilot/rollback/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "operator_rollback_ui" }),
    });
    await load();
  }

  async function setKill(domain: string, position: string) {
    await fetch(`/api/full-autopilot/domain/${domain}/kill-switch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position, reason: "operator_kill_switch_ui" }),
    });
    await load();
  }

  async function bulkApproveLowRiskPending() {
    const pending = (data?.approvals ?? []).filter(
      (a) => a.status === "PENDING" && (a.riskLevel === "LOW" || a.riskLevel === "MEDIUM")
    );
    for (const p of pending) {
      await approveRow(p.id);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <AdminCommandBar title="LECIPM · Full Autopilot Control Center" />

      <Card variant="alert" className="space-y-2">
        <p className="text-sm font-semibold text-amber-50">Bounded autonomy</p>
        <p className="text-sm text-amber-100/95">
          {data?.advisory ??
            "Automatic execution is limited to policy-approved low-risk actions. High-impact and compliance-sensitive flows remain gated."}
        </p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="danger" size="sm" onClick={() => void pauseAll(true)}>
          Pause all autopilot
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void pauseAll(false)}>
          Resume all
        </Button>
        <Button variant="goldPrimary" size="sm" onClick={() => void bulkApproveLowRiskPending()}>
          Approve low/medium-risk pending (batch)
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {data?.globalPause?.paused ?
        <p className="text-sm font-medium text-red-700">Global pause is ON — new executes are blocked.</p>
      : null}

      {error ?
        <p className="text-sm text-red-700">{error}</p>
      : null}
      {loading ?
        <p className="text-sm text-[#5C5C57]">Loading…</p>
      : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B0B0B]">1. Mode overview</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <input
            placeholder="Filter domain contains…"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="rounded-lg border border-[#D9D9D2] px-2 py-1"
          />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-lg border border-[#D9D9D2] px-2 py-1"
          >
            <option value="all">All risk tiers</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {filteredModes.map((m) => (
            <Card key={m.domain} variant="dashboardPanel" className="space-y-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold text-[#0B0B0B]">{m.domain}</p>
                <span className="text-xs uppercase text-[#5C5C57]">{m.riskLevel}</span>
              </div>
              <p className="text-[#5C5C57]">
                Mode: <span className="font-medium text-[#0B0B0B]">{m.effectiveMode}</span> · Kill:{" "}
                <span className="font-medium text-[#0B0B0B]">{m.killSwitch}</span>
              </p>
              <p className="text-xs text-[#8A8A84]">{m.reason}</p>
              <p className="text-xs text-[#5C5C57]">
                Bounded full autopilot eligible: {m.boundedFullAutopilotEligible ? "yes" : "no"} · Gated:{" "}
                {m.gatedHighRisk ? "yes" : "no"}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" className="!text-[#0B0B0B]" onClick={() => void setKill(m.domain, "OFF")}>
                  Kill OFF
                </Button>
                <Button variant="outline" size="sm" className="!text-[#0B0B0B]" onClick={() => void setKill(m.domain, "LIMITED")}>
                  Limited
                </Button>
                <Button variant="secondary" size="sm" onClick={() => void setKill(m.domain, "ON")}>
                  Kill ON
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B0B0B]">2. Live execution feed</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <FeedColumn title="Automatic" rows={data?.liveFeed?.automatic as object[]} />
          <FeedColumn title="Queued approvals" rows={data?.liveFeed?.queuedApprovals as object[]} />
          <FeedColumn title="Blocked" rows={data?.liveFeed?.blocked as object[]} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B0B0B]">3. Approval queue</h2>
        <div className="space-y-3">
          {(data?.approvals ?? [])
            .filter((a) => a.status === "PENDING")
            .map((a) => (
              <Card key={a.id} variant="dashboardPanel" className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-[#0B0B0B]">
                    {a.domain} · {a.actionType}
                  </p>
                  <p className="text-[#5C5C57]">{a.explanation}</p>
                  <p className="text-xs text-[#8A8A84]">Risk: {a.riskLevel}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="goldPrimary" size="sm" onClick={() => void approveRow(a.id)}>
                    Approve
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => void rejectRow(a.id)}>
                    Reject
                  </Button>
                  <Link
                    href={`/dashboard/admin/full-autopilot/${a.id}`}
                    className="text-sm font-medium text-premium-gold underline-offset-4 hover:underline"
                  >
                    Inspect (platform action)
                  </Link>
                </div>
              </Card>
            ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B0B0B]">4. Kill switches</h2>
        <p className="text-sm text-[#5C5C57]">
          Per-domain buttons above issue immediate OFF / LIMITED / ON. History remains in execution logs.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B0B0B]">5. Outcome metrics (7d)</h2>
        {data?.outcomeMetrics ?
          <Card variant="stat" className="text-sm text-white">
            <p>
              Total evaluations: {data.outcomeMetrics.totalExecutions} · Auto: {data.outcomeMetrics.allowCount} · Queue:{" "}
              {data.outcomeMetrics.requireApprovalCount} · Blocked: {data.outcomeMetrics.blockCount}
            </p>
            <p className="mt-1">
              Success mix: {(data.outcomeMetrics.successRate * 100).toFixed(0)}% · Rollbacks:{" "}
              {data.outcomeMetrics.rollbackCount}
            </p>
          </Card>
        : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B0B0B]">6. Rollback panel</h2>
        <p className="text-sm text-[#5C5C57]">
          Only executions flagged reversible in policy may roll back; destructive or compliance paths stay blocked.
        </p>
        <div className="space-y-2">
          {(data?.rollbackCandidates ?? []).map((r) => (
            <Card key={r.id} variant="dashboardPanel" className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-[#0B0B0B]">
                  {r.domain} · {r.actionType}
                </p>
                <Link href={`/dashboard/admin/full-autopilot/${r.id}`} className="text-xs text-premium-gold hover:underline">
                  Execution detail
                </Link>
              </div>
              <Button variant="outline" size="sm" className="!text-[#0B0B0B]" onClick={() => void rollbackExec(r.id)}>
                Request rollback
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B0B0B]">7. Alerts</h2>
        <div className="space-y-2">
          {(data?.alerts ?? []).map((a, i) => (
            <Card
              key={`${a.title}-${i}`}
              variant={a.severity === "critical" ? "alert" : "dashboardPanel"}
              className="text-sm"
            >
              <p className="font-semibold">{a.title}</p>
              <p className={a.severity === "critical" ? "text-amber-50" : "text-[#5C5C57]"}>{a.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B0B0B]">Widgets</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Card variant="dashboardPanel" className="text-sm">
            <p className="font-semibold text-[#0B0B0B]">Today’s autonomous wins</p>
            <p className="text-[#5C5C57]">
              Automatic lane volume (7d): {data?.outcomeMetrics?.allowCount ?? 0} · Est. minutes saved (proxy):{" "}
              {data?.measurementNotes?.operatorWidgets?.estimatedMinutesSaved7d ?? 0}
            </p>
          </Card>
          <Card variant="dashboardPanel" className="text-sm">
            <p className="font-semibold text-[#0B0B0B]">Actions reverted today</p>
            <p className="text-2xl font-semibold text-[#0B0B0B]">
              {data?.measurementNotes?.operatorWidgets?.rollbacksToday ?? 0}
            </p>
          </Card>
          <Card variant="dashboardPanel" className="text-sm">
            <p className="font-semibold text-[#0B0B0B]">Outcome-linked executions (7d)</p>
            <p className="text-[#5C5C57]">{data?.measurementNotes?.operatorWidgets?.outcomeLinkedExecutions7d ?? 0}</p>
          </Card>
          <Card variant="dashboardPanel" className="text-sm md:col-span-2">
            <p className="font-semibold text-[#0B0B0B]">Domains needing review</p>
            <ul className="mt-2 list-inside list-disc text-[#5C5C57]">
              {(data?.recommendations ?? [])
                .filter((r) => r.changeUrgency !== "low")
                .slice(0, 6)
                .map((r) => (
                  <li key={r.domain}>
                    {r.domain}: {r.explanation}
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}

function FeedColumn({ title, rows }: { title: string; rows: object[] | undefined }) {
  const safe = rows ?? [];
  return (
    <Card variant="dashboardPanel" className="max-h-72 overflow-y-auto text-xs">
      <p className="mb-2 font-semibold text-[#0B0B0B]">{title}</p>
      {safe.length === 0 ?
        <p className="text-[#5C5C57]">No rows.</p>
      : (
        <ul className="space-y-2 text-[#5C5C57]">
          {safe.slice(0, 12).map((r, i) => (
            <li key={i}>
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify(r, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
