"use client";

import type { ReactNode } from "react";
import type { DrBrainMetrics } from "@/lib/drbrain/metrics";
import { DRBRAIN_INVESTOR_DEMO_KPIS } from "@/lib/drbrain/demo-data";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Props = {
  metrics: DrBrainMetrics;
  kpis: typeof DRBRAIN_INVESTOR_DEMO_KPIS;
  /** Shown under KPI cards — must match investor-demo ribbon copy. */
  demoBanner?: string;
};

const COLORS = ["#6366f1", "#f97316", "#22c55e", "#94a3b8"];

export function DrBrainInvestorDemoCharts(props: Props) {
  const { metrics, kpis, demoBanner } = props;

  const axis = metrics.timestamps.map((ts, i) => ({
    hour: `${new Date(ts).getUTCHours().toString().padStart(2, "0")}:00`,
    health: Math.min(100, 94 + Math.sin(i / 3) * 2),
    anomaly: metrics.anomalyScores[i] ?? 0,
    attempts: metrics.paymentAttempts[i] ?? 0,
    blocked: metrics.blockedPayments[i] ?? 0,
  }));

  const payoutBars = [
    { name: "HELD", value: metrics.payouts.held },
    { name: "ELIGIBLE", value: metrics.payouts.eligible },
    { name: "RELEASED", value: metrics.payouts.released },
    { name: "BLOCKED", value: metrics.payouts.blocked },
  ];

  const severityPie = [
    { name: "CRITICAL", value: 2 },
    { name: "WARNING", value: 6 },
    { name: "INFO", value: 4 },
  ];

  return (
    <div className="space-y-6">
      {demoBanner ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-950">
          {demoBanner}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DemoCard label="Platform health" value={kpis.platformHealthPct} />
        <DemoCard label="Issues detected" value={String(kpis.issuesDetected)} />
        <DemoCard label="Auto-protected incidents" value={String(kpis.autoProtectedIncidents)} />
        <DemoCard label="Payment anomalies blocked" value={String(kpis.paymentAnomaliesBlocked)} />
        <DemoCard label="Fraud attempts prevented" value={String(kpis.fraudAttemptsPrevented)} />
        <DemoCard label="Avg response time" value={`${kpis.avgResponseMs} ms`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DemoWrap title="Health score over time">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={axis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis domain={[88, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="health" stroke="#059669" strokeWidth={2} dot={false} name="Health %" />
            </LineChart>
          </ResponsiveContainer>
        </DemoWrap>
        <DemoWrap title="Anomaly score trend">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={axis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="anomaly" stroke="#c026d3" strokeWidth={2} dot={false} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </DemoWrap>
        <DemoWrap title="Payment attempts vs blocked">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={axis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="attempts" fill="#6366f1" name="Attempts" radius={[4, 4, 0, 0]} />
              <Bar dataKey="blocked" fill="#ea580c" name="Blocked" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DemoWrap>
        <DemoWrap title="Payout escrow snapshot">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={payoutBars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DemoWrap>
        <DemoWrap title="Ticket severity mix (simulated)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Tooltip />
              <Pie data={severityPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88}>
                {severityPie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </DemoWrap>
      </div>
    </div>
  );
}

function DemoCard(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-violet-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">{props.label}</p>
      <p className="text-lg font-semibold text-violet-950">{props.value}</p>
    </div>
  );
}

function DemoWrap(props: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-violet-100 bg-white p-3 shadow-sm ${props.className ?? ""}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700">{props.title}</p>
      {props.children}
    </div>
  );
}
