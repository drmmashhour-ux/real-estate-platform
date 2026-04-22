"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type {
  AdminTransactionRowVm,
  AdminTransactionsPageVm,
} from "@/modules/dashboard/services/admin-transactions.service";

type Props = {
  adminBase: string;
  data: AdminTransactionsPageVm;
};

type HubFilter = "all" | AdminTransactionRowVm["hubKey"];
type StatusFilter = "all" | "paid" | "pending" | "failed";

export function AdminTransactionsLuxuryClient({ adminBase, data }: Props) {
  const [hubFilter, setHubFilter] = useState<HubFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "amount" | "hub">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<AdminTransactionRowVm | null>(null);

  const filtered = useMemo(() => {
    let r = data.rows;
    const q = query.trim().toLowerCase();
    if (hubFilter !== "all") r = r.filter((row) => row.hubKey === hubFilter);
    if (statusFilter !== "all") r = r.filter((row) => row.status.toLowerCase() === statusFilter);
    if (q) {
      r = r.filter(
        (row) =>
          row.id.toLowerCase().includes(q) ||
          row.userLabel.toLowerCase().includes(q) ||
          row.typeLabel.toLowerCase().includes(q) ||
          (row.bookingId?.toLowerCase().includes(q) ?? false),
      );
    }
    const mult = sortDir === "asc" ? 1 : -1;
    const sorted = [...r].sort((a, b) => {
      if (sortKey === "amount") return mult * (a.amountGrossCents - b.amountGrossCents);
      if (sortKey === "hub") return mult * a.hubLabel.localeCompare(b.hubLabel);
      return mult * (new Date(a.createdAtIso).getTime() - new Date(b.createdAtIso).getTime());
    });
    return sorted;
  }, [data.rows, hubFilter, query, sortDir, sortKey, statusFilter]);

  const chartMax = useMemo(() => {
    let m = 1;
    for (const p of data.chart) m = Math.max(m, p.grossCents);
    return m;
  }, [data.chart]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">Transactions</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Financial movements</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              Ledger sourced from paid platform settlements (<span className="text-white/70">Stripe</span>{" "}
              → <span className="text-white/70">platform_payments</span>). Gross volume vs estimated platform share
              are labeled separately for reconciliation.
            </p>
          </div>
          <Link
            href={adminBase}
            className="shrink-0 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
          >
            ← Command Center
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#0B0B0B] p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-[180px] flex-1 flex-col gap-2 text-xs uppercase tracking-wider text-white/45">
            Hub
            <select
              value={hubFilter}
              onChange={(e) => setHubFilter(e.target.value as HubFilter)}
              className="rounded-xl border border-white/12 bg-black px-3 py-2.5 text-sm normal-case tracking-normal text-white"
            >
              <option value="all">All hubs</option>
              <option value="bnhub">BNHub</option>
              <option value="broker">Broker Hub</option>
              <option value="seller">Seller Hub</option>
              <option value="buyer">Buyer Hub</option>
              <option value="investor">Investor Hub</option>
              <option value="platform">Platform</option>
            </select>
          </label>
          <label className="flex min-w-[160px] flex-1 flex-col gap-2 text-xs uppercase tracking-wider text-white/45">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-xl border border-white/12 bg-black px-3 py-2.5 text-sm normal-case tracking-normal text-white"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label className="flex min-w-[220px] flex-[2] flex-col gap-2 text-xs uppercase tracking-wider text-white/45">
            Search
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ID, booking, payer…"
              className="rounded-xl border border-white/12 bg-black px-3 py-2.5 text-sm normal-case tracking-normal text-white placeholder:text-white/35"
            />
          </label>
        </div>

        {/* Stats */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Gross volume today" value={data.stats.grossVolumeTodayDisplay} hint="Paid checkout volume" />
          <StatCard
            label="Platform share (est.)"
            value={data.stats.platformShareTodayDisplay}
            hint="Fees / platform portion"
          />
          <StatCard label="Paid transactions (30d)" value={String(data.stats.transactions30dPaid)} hint="Successful" />
          <StatCard
            label="Success rate (30d)"
            value={data.stats.successRate30dDisplay}
            hint={`Pending: ${data.stats.pending30d}`}
          />
        </div>

        {/* Chart */}
        <div className="mt-10 rounded-[28px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Revenue over time</div>
              <p className="mt-1 text-sm text-white/50">Daily gross paid volume (UTC days)</p>
            </div>
          </div>
          <div className="mt-8 flex h-[220px] items-end gap-1 sm:gap-2">
            {data.chart.map((p) => {
              const hPct = Math.max(8, Math.round((p.grossCents / chartMax) * 100));
              return (
                <div key={p.date} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-[#D4AF37]/25 to-[#D4AF37]/65"
                    style={{ height: `${hPct}%` }}
                    title={`${p.date}: gross`}
                  />
                  <span className="hidden text-[10px] text-white/40 sm:inline">{p.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-[#0B0B0B]">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-white/55">
              Showing <span className="text-white">{filtered.length}</span> of {data.rows.length} loaded
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/45">
              <SortChip active={sortKey === "date"} onClick={() => toggleSort("date")}>
                Date {sortKey === "date" ? (sortDir === "desc" ? "↓" : "↑") : ""}
              </SortChip>
              <SortChip active={sortKey === "amount"} onClick={() => toggleSort("amount")}>
                Amount {sortKey === "amount" ? (sortDir === "desc" ? "↓" : "↑") : ""}
              </SortChip>
              <SortChip active={sortKey === "hub"} onClick={() => toggleSort("hub")}>
                Hub {sortKey === "hub" ? (sortDir === "desc" ? "↓" : "↑") : ""}
              </SortChip>
            </div>
          </div>

          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_minmax(0,0.85fr)] gap-3 border-b border-white/10 px-5 py-3 text-[11px] uppercase tracking-wider text-white/45 lg:grid">
            <span>Reference</span>
            <span>Type</span>
            <span>Counterparty</span>
            <span>Gross</span>
            <span>Platform est.</span>
            <span>Status</span>
            <span>When</span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {filtered.map((tx) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => setSelected(tx)}
                className="grid w-full grid-cols-1 gap-2 px-5 py-4 text-left transition hover:bg-white/[0.04] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_minmax(0,0.85fr)] lg:items-center lg:gap-3"
              >
                <span className="font-mono text-xs text-white/65">{tx.shortId}</span>
                <span className="text-sm text-white">{tx.typeLabel}</span>
                <span className="text-sm text-white/75">{tx.userLabel}</span>
                <span className="text-[#D4AF37]">{tx.amountGrossDisplay}</span>
                <span className="text-white/55">{tx.platformShareDisplay}</span>
                <span className={statusClass(tx.statusTone)}>{tx.status}</span>
                <span className="text-xs text-white/45">{tx.dateLabel}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-white/45">No rows match these filters.</div>
          ) : null}
        </div>
      </div>

      {/* Drawer */}
      {selected ? (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0D0D0D] shadow-2xl">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Transaction</div>
              <h2 className="mt-2 text-xl font-semibold text-white">Settlement detail</h2>
              <p className="mt-2 font-mono text-xs text-white/45">{selected.id}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <Detail label="Type" value={selected.typeLabel} />
              <Detail label="Payment type (raw)" value={selected.paymentTypeRaw} mono />
              <Detail label="Hub" value={selected.hubLabel} />
              <Detail label="Counterparty" value={selected.userLabel} />
              <Detail label="Gross amount" value={selected.amountGrossDisplay} accent />
              <Detail label="Platform share (est.)" value={selected.platformShareDisplay} />
              <Detail label="Status" value={selected.status} />
              <Detail label="Created (UTC)" value={selected.createdAtIso} mono />
              {selected.bookingId ? <Detail label="Booking ID" value={selected.bookingId} mono /> : null}
              {selected.dealId ? <Detail label="Deal ID" value={selected.dealId} mono /> : null}
              {selected.listingId ? <Detail label="Listing ID" value={selected.listingId} mono /> : null}
              {selected.stripeSessionTail ? (
                <Detail label="Stripe session (tail)" value={selected.stripeSessionTail} mono />
              ) : null}
              {selected.stripePiTail ? (
                <Detail label="PaymentIntent (tail)" value={selected.stripePiTail} mono />
              ) : null}
              <p className="mt-6 text-xs leading-relaxed text-white/40">
                Card numbers and full Stripe identifiers are never shown here. Use Stripe Dashboard for forensic
                reconciliation.
              </p>
            </div>
            <div className="border-t border-white/10 p-6">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full rounded-full bg-[#D4AF37] py-3 text-sm font-medium text-black hover:brightness-110"
              >
                Close
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </main>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[24px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-5">
      <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-xs text-white/45">{hint}</div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="mb-5">
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={`mt-1 text-sm ${accent ? "text-[#D4AF37]" : "text-white"} ${mono ? "font-mono text-xs break-all" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function statusClass(tone: AdminTransactionRowVm["statusTone"]): string {
  if (tone === "success") return "text-emerald-400 text-sm capitalize";
  if (tone === "failed") return "text-rose-400 text-sm capitalize";
  return "text-amber-300 text-sm capitalize";
}

function SortChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 transition ${
        active ? "border-[#D4AF37]/45 text-[#D4AF37]" : "border-white/10 text-white/55 hover:border-white/20"
      }`}
    >
      {children}
    </button>
  );
}
