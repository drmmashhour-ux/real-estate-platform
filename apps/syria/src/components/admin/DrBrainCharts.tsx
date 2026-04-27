"use client";

import type { DrBrainMetrics } from "@/lib/drbrain/metrics";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export type DrBrainChartsLabels = {
  paymentsLine: string;
  blockedLine: string;
  payoutBar: string;
  anomalyLine: string;
  errorRateLine: string;
  totalsHint: string;
};

type Props = {
  metrics: DrBrainMetrics;
  labels: DrBrainChartsLabels;
};

export function DrBrainCharts(props: Props) {
  const { metrics, labels } = props;

  const axisData = metrics.timestamps.map((ts, i) => ({
    hour: `${new Date(ts).getUTCHours().toString().padStart(2, "0")}:00`,
    attempts: metrics.paymentAttempts[i] ?? 0,
    blocked: metrics.blockedPayments[i] ?? 0,
    anomaly: metrics.anomalyScores[i] ?? 0,
    err: metrics.errorRate[i] ?? 0,
  }));

  const payoutBars = [
    { name: "HELD", value: metrics.payouts.held },
    { name: "ELIGIBLE", value: metrics.payouts.eligible },
    { name: "RELEASED", value: metrics.payouts.released },
    { name: "BLOCKED", value: metrics.payouts.blocked },
  ];

  const chartWrap = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm";
  const titleCls = "text-xs font-semibold uppercase tracking-wide text-stone-500";

  return (
    <div className="space-y-6">
      <p className="text-xs text-stone-500">{labels.totalsHint}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={chartWrap}>
          <p className={titleCls}>{labels.paymentsLine}</p>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={axisData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="attempts" stroke="#6366f1" strokeWidth={2} dot={false} name="Attempts" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={chartWrap}>
          <p className={titleCls}>{labels.blockedLine}</p>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={axisData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={2} dot={false} name="Blocked" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={`${chartWrap} lg:col-span-2`}>
          <p className={titleCls}>{labels.payoutBar}</p>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payoutBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" name="Count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={chartWrap}>
          <p className={titleCls}>{labels.anomalyLine}</p>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={axisData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="anomaly" stroke="#a21caf" strokeWidth={2} dot={false} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={chartWrap}>
          <p className={titleCls}>{labels.errorRateLine}</p>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={axisData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number | string) => [`${Number(v).toFixed(1)}%`, labels.errorRateLine]} />
                <Legend />
                <Line type="monotone" dataKey="err" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Rate" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
