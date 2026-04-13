"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SmartDashboardData } from "@/lib/admin/get-smart-dashboard";

const GOLD = "rgb(var(--premium-gold-channels) / 0.85)";
const MUTED = ["#64748b", "#94a3b8", "#cbd5e1", "#475569", "#334155"];
const PIE_COLORS = ["#d4af37", "#94a3b8", "#38bdf8", "#a78bfa", "#64748b"];

function fmtMoney(cents: number, currency = "CAD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function SmartAdminDashboard({ data }: { data: SmartDashboardData }) {
  const maxFunnel = Math.max(1, ...data.funnel.map((f) => f.count));
  const growthHasData = data.growthSeries.some((g) => g.users > 0 || g.revenueCents > 0);
  const revMax = Math.max(1, ...data.revenue.bySource.map((r) => r.cents));

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">
            LECIPM operations
          </p>
          <h1 className="text-2xl font-bold text-white">Smart admin dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Rolling {data.windowDays}-day window unless noted · live snapshot from production data
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/listings"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
          >
            Listings
          </Link>
          <Link
            href="/admin/users"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
          >
            Users
          </Link>
          <Link
            href="/admin/brokers"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
          >
            Brokers
          </Link>
          <Link
            href="/admin/bookings"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
          >
            Bookings
          </Link>
          <Link
            href="/admin/funnel"
            className="rounded-lg border border-premium-gold/40 bg-premium-gold/10 px-3 py-1.5 text-xs font-semibold text-premium-gold hover:bg-premium-gold/20"
          >
            Funnel detail
          </Link>
        </div>
      </header>

      {data.alerts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">Alerts</h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {data.alerts.map((a) => (
              <li key={a.id}>
                <Link
                  href={a.href}
                  className={`flex flex-col rounded-xl border px-4 py-3 transition hover:bg-white/[0.04] ${
                    a.severity === "high"
                      ? "border-red-500/40 bg-red-500/10"
                      : a.severity === "medium"
                        ? "border-amber-500/35 bg-amber-500/10"
                        : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <span className="text-sm font-medium text-white">{a.title}</span>
                  <span className="mt-0.5 text-xs text-slate-400">{a.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">KPIs</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Kpi label="Visitors" value={data.kpis.visitors.toLocaleString()} hint="30d tracked visits" />
          <Kpi label="Active users" value={data.kpis.activeUsers.toLocaleString()} hint="Updated in 30d" />
          <Kpi label="New buyers" value={data.kpis.newBuyers.toLocaleString()} hint="7d signups · persona buyer" />
          <Kpi label="New sellers" value={data.kpis.newSellers.toLocaleString()} hint="7d signups · direct seller" />
          <Kpi label="Self-serve sellers" value={data.kpis.selfSellers.toLocaleString()} hint="Free hub / no broker mode" />
          <Kpi
            label="Broker-assisted"
            value={data.kpis.brokerAssistedUsers.toLocaleString()}
            hint="Platform or preferred broker"
          />
          <Kpi
            label="Document requests"
            value={data.kpis.documentRequests.toLocaleString()}
            hint="OACIQ + tax + FSBO slots"
          />
          <Kpi label="Bookings" value={data.kpis.bookings.toLocaleString()} hint="Created in window" />
          <Kpi label="Revenue" value={fmtMoney(data.kpis.revenueCents)} hint="Paid platform payments · window" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
          <h2 className="text-sm font-semibold text-white">User segmentation</h2>
          <p className="mt-1 text-xs text-slate-500">Counts are best-effort labels from personas and seller mode.</p>
          <ul className="mt-4 space-y-2">
            {data.segmentation.map((s) => (
              <li
                key={s.key}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
              >
                <span className="text-sm text-slate-300">{s.label}</span>
                <span className="font-mono text-sm text-premium-gold">{s.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
          <h2 className="text-sm font-semibold text-white">Documents &amp; OACIQ</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/5 p-3">
              <dt className="text-xs text-slate-500">Broker license (OACIQ-style) pending</dt>
              <dd className="text-xl font-semibold text-white">{data.documents.oaciqPending}</dd>
            </div>
            <div className="rounded-lg border border-white/5 p-3">
              <dt className="text-xs text-slate-500">Broker tax registration review</dt>
              <dd className="text-xl font-semibold text-white">{data.documents.brokerTaxPending}</dd>
            </div>
            <div className="rounded-lg border border-white/5 p-3">
              <dt className="text-xs text-slate-500">BNHub listings · docs requested</dt>
              <dd className="text-xl font-semibold text-white">{data.documents.bnhubPendingDocuments}</dd>
            </div>
            <div className="rounded-lg border border-white/5 p-3">
              <dt className="text-xs text-slate-500">FSBO document slots (missing / review)</dt>
              <dd className="text-xl font-semibold text-white">{data.documents.fsboPendingDocuments}</dd>
            </div>
          </dl>
          {data.documents.byType.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-400">FSBO document types (inventory)</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {data.documents.byType.map((d) => (
                  <li
                    key={d.docType}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {d.docType}{" "}
                    <span className="font-mono text-premium-gold">{d.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-premium-gold/20 bg-[#0a0a0a] p-5">
          <h2 className="text-sm font-semibold text-premium-gold">Funnel · visitors → payment</h2>
          <p className="mt-1 text-xs text-slate-500">From analytics events in the same window.</p>
          <div className="mt-4 space-y-2">
            {data.funnel.map((step) => (
              <div key={step.key} className="flex items-center gap-3">
                <div className="w-40 shrink-0 text-xs text-slate-400">{step.label}</div>
                <div className="h-7 min-w-0 flex-1 overflow-hidden rounded bg-white/5">
                  <div
                    className="h-full rounded bg-gradient-to-r from-premium-gold/80 to-premium-gold/30"
                    style={{ width: `${(step.count / maxFunnel) * 100}%` }}
                  />
                </div>
                <div className="w-14 text-right font-mono text-xs text-slate-200">{step.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
          <h2 className="text-sm font-semibold text-white">User intent (personas)</h2>
          <div className="mt-2 h-64 w-full">
            {data.intentPie.length === 0 ? (
              <p className="text-sm text-slate-500">No persona distribution yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.intentPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {data.intentPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid rgba(212,175,55,0.35)",
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
          <h2 className="text-sm font-semibold text-white">Growth · users &amp; revenue / day</h2>
          {!growthHasData ? (
            <p className="mt-4 text-sm text-slate-500">Not enough daily series yet.</p>
          ) : (
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.growthSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickFormatter={(v) => `${Math.round(v / 100)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid rgba(212,175,55,0.35)",
                      borderRadius: 8,
                    }}
                    formatter={(value: number | string, name: string) =>
                      name === "revenueCents"
                        ? [fmtMoney(Number(value)), "Revenue"]
                        : [value, "New users"]
                    }
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="users"
                    name="New users"
                    stroke={GOLD}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenueCents"
                    name="Revenue (¢)"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
          <h2 className="text-sm font-semibold text-white">Revenue by source</h2>
          <p className="mt-1 text-xs text-slate-500">Platform payment types · paid in window</p>
          {data.revenue.bySource.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No paid breakdown in this window.</p>
          ) : (
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.revenue.bySource.map((r) => ({
                    ...r,
                    label: r.source,
                    pct: Math.round((r.cents / revMax) * 100),
                  }))}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 80, bottom: 0 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={76}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid rgba(212,175,55,0.35)",
                      borderRadius: 8,
                    }}
                    formatter={(v: number) => fmtMoney(v)}
                  />
                  <Bar dataKey="cents" radius={[0, 4, 4, 0]}>
                    {data.revenue.bySource.map((_, i) => (
                      <Cell key={i} fill={MUTED[i % MUTED.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
          <h2 className="text-sm font-semibold text-white">Revenue</h2>
          <p className="mt-1 text-2xl font-bold text-premium-gold">{fmtMoney(data.revenue.totalCents)}</p>
          <p className="text-xs text-slate-500">Total paid platform revenue · {data.windowDays}d</p>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Top earning listings
          </h3>
          {data.revenue.topListings.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No listing-attributed payments yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {data.revenue.topListings.map((l) => {
                const href = l.kind === "fsbo" ? `/admin/fsbo/${l.listingId}` : `/admin/listings`;
                const inner = (
                  <>
                    <span className="min-w-0 truncate text-slate-300">
                      <span className="text-[10px] uppercase text-slate-500">{l.kind}</span> {l.label}
                    </span>
                    <span className="shrink-0 font-mono text-premium-gold">{fmtMoney(l.cents)}</span>
                  </>
                );
                return (
                  <li key={l.key}>
                    <Link
                      href={href}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/5 px-3 py-2 text-sm transition hover:border-premium-gold/30 hover:bg-white/[0.04]"
                    >
                      {inner}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
          <h2 className="text-sm font-semibold text-white">Live activity</h2>
          <p className="mt-1 text-xs text-slate-500">Recent users, listings, bookings, payments (merged)</p>
          <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
            {data.activity.map((item) => (
              <li
                key={`${item.type}-${item.id}-${item.at}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-white/5 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-medium text-slate-200">
                    <span className="mr-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                      {item.type}
                    </span>
                    {item.title}
                  </span>
                  <div className="mt-0.5 truncate text-slate-500">{item.subtitle}</div>
                </div>
                <time className="shrink-0 text-slate-500">{fmtTime(item.at)}</time>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[11px] text-slate-600">{hint}</p>
    </div>
  );
}
