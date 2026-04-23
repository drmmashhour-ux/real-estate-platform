"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminCommandBar } from "@/components/admin/AdminCommandBar";
import type { ExecutiveSummaryPayload } from "@/lib/executive/safety";

type SnapshotRow = {
  id: string;
  overallHealthScore: number | null;
  riskLevel: string | null;
  platformMetrics?: PlatformMetrics | null;
  complianceMetrics?: ComplianceMetrics | null;
  financialMetrics?: FinancialMetrics | null;
  investorMetrics?: InvestorMetrics | null;
  marketMetrics?: MarketMetrics | null;
  aiMetrics?: AiMetrics | null;
  summary: string | null;
  metadata?: { partialCoverage?: boolean; coverageNotes?: string[] } | null;
};

type PlatformMetrics = {
  listingsCount?: number;
  dealsCount?: number;
  strongDealsCount?: number;
  pipelineDealsCount?: number;
  alertsCount?: number;
  highAlertsCount?: number;
  workflowsPending?: number;
  buyBoxMatches?: number;
  savedSearches?: number;
  watchlistItems?: number;
};

type ComplianceMetrics = {
  complianceAlerts?: number;
  legalAlertsOpen?: number;
  trustReconciliationMismatchCount?: number;
  taxRecords?: number;
  transactionRecords?: number;
};

type FinancialMetrics = {
  totalPortfolioValueCents?: number | null;
  totalPortfolioCashflowCents?: number | null;
  taxRecords?: number;
  transactionRecords?: number;
};

type InvestorMetrics = {
  portfoliosCount?: number;
  buyBoxMatches?: number;
  watchlistItems?: number;
  autopilotRecommendations?: number;
};

type MarketMetrics = {
  hotZones?: number;
  dealsCount?: number;
  strongDealsCount?: number;
  valuationsCount?: number;
  marketReportsCount?: number;
};

type AiMetrics = {
  aiSuggestions?: number;
  autopilotRecommendations?: number;
  workflowsPending?: number;
};

const PIE_COLORS = ["#D4AF37", "#4a4a4a"];

const QUICK_ACTIONS: { href: string; label: string }[] = [
  { href: "/dashboard/admin/compliance", label: "Compliance" },
  { href: "/dashboard/admin/financial/transactions", label: "Financial / transactions" },
  { href: "/dashboard/broker/investor", label: "Investor portfolio" },
  { href: "/dashboard/broker/appraisal", label: "Appraisal & analysis" },
  { href: "/dashboard/broker/market-watch", label: "Real Estate Watch (pulse)" },
  { href: "/dashboard/broker/market-watch/zones", label: "Live activity zones" },
  { href: "/dashboard/broker/alerts", label: "Alerts & digest" },
  { href: "/dashboard/broker/portfolio/autopilot", label: "Portfolio autopilot" },
];

export default function ExecutiveCommandCenterPage() {
  const [snapshot, setSnapshot] = useState<SnapshotRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [copilotQ, setCopilotQ] = useState("");
  const [copilotA, setCopilotA] = useState<string | null>(null);
  const [copilotBusy, setCopilotBusy] = useState(false);

  const logEvent = useCallback(async (action: string, extra?: { href?: string; label?: string }) => {
    try {
      await fetch("/api/executive/command-center/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
    } catch {
      /* non-blocking */
    }
  }, []);

  useEffect(() => {
    void logEvent("COMMAND_CENTER_OPENED");
    void (async () => {
      const res = await fetch("/api/executive/snapshot");
      const data = await res.json().catch(() => ({}));
      if (data.snapshot) setSnapshot(data.snapshot as SnapshotRow);
    })();
  }, [logEvent]);

  async function refreshSnapshot() {
    setLoading(true);
    try {
      const data = await fetch("/api/executive/snapshot", {
        method: "POST",
        body: JSON.stringify({ ownerType: "admin" }),
        headers: { "Content-Type": "application/json" },
      }).then((r) => r.json());
      if (data.snapshot) setSnapshot(data.snapshot as SnapshotRow);
    } finally {
      setLoading(false);
    }
  }

  async function askCopilot() {
    if (!copilotQ.trim()) return;
    setCopilotBusy(true);
    setCopilotA(null);
    try {
      const data = await fetch("/api/executive/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: copilotQ, snapshotId: snapshot?.id }),
      }).then((r) => r.json());
      if (data.answer) setCopilotA(data.answer as string);
      else if (data.error) setCopilotA(`Error: ${data.error}`);
    } finally {
      setCopilotBusy(false);
    }
  }

  let parsedSummary: ExecutiveSummaryPayload | null = null;
  if (snapshot?.summary) {
    try {
      parsedSummary = JSON.parse(snapshot.summary) as ExecutiveSummaryPayload;
    } catch {
      parsedSummary = null;
    }
  }

  const pm = snapshot?.platformMetrics ?? undefined;
  const platformData = snapshot
    ? [
        { name: "Listings", value: pm?.listingsCount ?? 0 },
        { name: "Deal signals", value: pm?.dealsCount ?? 0 },
        { name: "Alerts", value: pm?.alertsCount ?? 0 },
        { name: "Workflows", value: pm?.workflowsPending ?? 0 },
      ]
    : [];

  const health = Math.round(snapshot?.overallHealthScore ?? 0);
  const riskData = snapshot
    ? [
        { name: "Health score", value: Math.max(0, health) },
        { name: "Residual stress", value: Math.max(1, 100 - health) },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]">Executive Command Center</h1>
          <p className="text-white/60">
            Unified strategic cockpit — platform, compliance, investor, market, and AI signals (advisory only; no
            auto-execution).
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/50">
            <span className="rounded-full border border-white/15 px-2 py-0.5">Platform data</span>
            <span className="rounded-full border border-white/15 px-2 py-0.5">Imported market data</span>
            <span className="rounded-full border border-white/15 px-2 py-0.5">Estimated AI insight</span>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <AdminCommandBar />
          <button
            type="button"
            onClick={() => void refreshSnapshot()}
            disabled={loading}
            className="rounded-xl bg-[#D4AF37] px-4 py-3 font-semibold text-black disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh snapshot"}
          </button>
        </div>
      </div>

      {snapshot?.metadata?.partialCoverage && snapshot.metadata.coverageNotes?.length ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          <div className="font-semibold text-amber-200">Partial coverage</div>
          <ul className="mt-2 list-disc pl-5">
            {snapshot.metadata.coverageNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {snapshot && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard title="Health score" value={snapshot.overallHealthScore} />
            <MetricCard title="Risk level" value={snapshot.riskLevel} />
            <MetricCard title="Listings" value={pm?.listingsCount} />
            <MetricCard title="Deal signals" value={pm?.dealsCount} />
            <MetricCard
              title="Compliance cases (open)"
              value={snapshot.complianceMetrics?.complianceAlerts}
            />
            <MetricCard title="Autopilot recs (open)" value={snapshot.aiMetrics?.autopilotRecommendations} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <div className="mb-3 text-lg text-[#D4AF37]">Platform activity mix</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={platformData}>
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                  <Bar dataKey="value" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <div className="mb-3 text-lg text-[#D4AF37]">Health vs stress (illustrative)</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                    {riskData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {parsedSummary && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Panel title="Executive summary" content={parsedSummary.summary} />
              <ListPanel title="Top priorities" items={parsedSummary.topPriorities} />
              <ListPanel title="Risks" items={parsedSummary.risks} />
              <ListPanel title="Opportunities" items={parsedSummary.opportunities} />
              <ListPanel title="Executive actions" items={parsedSummary.executiveActions} />
              {parsedSummary.dataScopeLabels?.length ? (
                <div className="rounded-2xl border border-white/10 bg-black p-5">
                  <div className="text-lg font-semibold text-[#D4AF37]">Data scope (AI)</div>
                  <ul className="mt-3 list-disc pl-5 text-sm text-white/75">
                    {parsedSummary.dataScopeLabels.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-black p-5">
            <div className="text-lg font-semibold text-[#D4AF37]">Executive copilot</div>
            <p className="mt-2 text-sm text-white/55">
              Ask advisory questions against the latest snapshot. Outputs are non-binding; humans approve regulated
              actions.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={copilotQ}
                onChange={(e) => setCopilotQ(e.target.value)}
                placeholder='e.g. "What is the biggest operational risk signal right now?"'
                className="flex-1 rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/50"
              />
              <button
                type="button"
                onClick={() => void askCopilot()}
                disabled={copilotBusy}
                className="rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-4 py-2 text-sm font-medium text-[#D4AF37] disabled:opacity-50"
              >
                {copilotBusy ? "Thinking…" : "Ask"}
              </button>
            </div>
            {copilotA ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/80 p-4 text-sm text-white/80">{copilotA}</div>
            ) : null}
          </div>

          <div>
            <div className="mb-3 text-lg font-semibold text-[#D4AF37]">Quick launches</div>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  onClick={() =>
                    void logEvent("COMMAND_CENTER_QUICK_ACTION", { href: a.href, label: a.label })
                  }
                  className="inline-flex items-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-sm font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniPanel
              title="Financial"
              lines={[
                `Portfolio value: ${formatMoney(snapshot.financialMetrics?.totalPortfolioValueCents)}`,
                `Portfolio cashflow: ${formatMoneyOrDash(snapshot.financialMetrics?.totalPortfolioCashflowCents)}`,
                `Tax documents: ${snapshot.financialMetrics?.taxRecords ?? 0}`,
                `Broker transactions: ${snapshot.financialMetrics?.transactionRecords ?? 0}`,
              ]}
            />
            <MiniPanel
              title="Compliance & trust"
              lines={[
                `Compliance cases (open): ${snapshot.complianceMetrics?.complianceAlerts ?? 0}`,
                `Legal alerts (open): ${snapshot.complianceMetrics?.legalAlertsOpen ?? 0}`,
                `Office recon discrepancies: ${snapshot.complianceMetrics?.trustReconciliationMismatchCount ?? 0}`,
              ]}
            />
            <MiniPanel
              title="Investor"
              lines={[
                `Active buy-box stances: ${snapshot.investorMetrics?.buyBoxMatches ?? 0}`,
                `Watchlist items: ${snapshot.investorMetrics?.watchlistItems ?? 0}`,
                `Portfolios (holdings rows): ${snapshot.investorMetrics?.portfoliosCount ?? 0}`,
              ]}
            />
            <MiniPanel
              title="Market & AI"
              lines={[
                `Hot market scores (≥75): ${snapshot.marketMetrics?.hotZones ?? 0}`,
                `AI suggestions (pending): ${snapshot.aiMetrics?.aiSuggestions ?? 0}`,
                `Workflows proposed: ${snapshot.aiMetrics?.workflowsPending ?? 0}`,
                `Property valuations: ${snapshot.marketMetrics?.valuationsCount ?? 0}`,
              ]}
            />
          </div>
        </>
      )}

      {!snapshot ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-white/60">
          No snapshot yet. Sign in as admin and press <strong className="text-white/80">Refresh snapshot</strong> to
          aggregate platform metrics and generate the executive briefing.
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="text-sm text-white/60">{title}</div>
      <div className="mt-2 text-xl font-semibold text-[#D4AF37]">{value ?? "—"}</div>
    </div>
  );
}

function Panel({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <div className="text-lg font-semibold text-[#D4AF37]">{title}</div>
      <div className="mt-3 text-white/80">{content}</div>
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <div className="text-lg font-semibold text-[#D4AF37]">{title}</div>
      <ul className="mt-3 list-disc pl-5 text-white/80">
        {(items ?? []).map((item, i) => (
          <li key={`${title}-${i}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function MiniPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="font-semibold text-[#D4AF37]">{title}</div>
      <div className="mt-3 space-y-2 text-sm text-white/70">
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function formatMoney(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "$0";
  return `$${(value / 100).toLocaleString()}`;
}

function formatMoneyOrDash(value?: number | null) {
  if (value == null) return "Not aggregated";
  return formatMoney(value);
}
