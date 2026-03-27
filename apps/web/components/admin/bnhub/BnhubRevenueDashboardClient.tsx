"use client";

import { useMemo, useState, useTransition } from "react";
import type { BnhubRevenueDashboardSnapshot } from "@/lib/bnhub/revenue-dashboard";

type SalesEntry = {
  id: string;
  stage: string;
  notes: string | null;
  nextFollowUpAt: string | null;
  guestEmail: string | null;
  guest: { id: string; email: string | null; name: string | null } | null;
  convertedBooking: { id: string; status: string; confirmationCode: string | null } | null;
};

type Plan = {
  id: string;
  sku: string;
  name: string;
  placement: string;
  billingPeriod: string;
  priceCents: number;
  currency: string;
};

type OrderRow = {
  id: string;
  status: string;
  amountCents: number;
  startAt: string;
  endAt: string;
  plan: Plan;
  payer: { id: string; email: string | null; name: string | null };
};

function fmtMoney(cents: number, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(cents / 100);
}

function pct(n: number | null) {
  if (n === null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

type Props = {
  initialSnapshot: BnhubRevenueDashboardSnapshot;
  initialSales: SalesEntry[];
  initialOrders: OrderRow[];
  plans: Plan[];
};

export function BnhubRevenueDashboardClient({
  initialSnapshot,
  initialSales,
  initialOrders,
  plans,
}: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [sales, setSales] = useState(initialSales);
  const [orders, setOrders] = useState(initialOrders);
  const [days, setDays] = useState(initialSnapshot.rangeDays);
  const [contentJson, setContentJson] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [newEmail, setNewEmail] = useState("");
  const [newStage, setNewStage] = useState("contacted");
  const [payerId, setPayerId] = useState("");
  const [planSku, setPlanSku] = useState(plans[0]?.sku ?? "");
  const [markPaid, setMarkPaid] = useState(true);

  const planOptions = useMemo(() => plans.map((p) => ({ sku: p.sku, label: `${p.name} (${fmtMoney(p.priceCents, p.currency.toUpperCase())})` })), [plans]);

  async function refreshAll(nextDays: number) {
    setErr(null);
    startTransition(async () => {
      try {
        const [dashRes, salesRes, ordRes] = await Promise.all([
          fetch(`/api/admin/bnhub-revenue-dashboard?days=${nextDays}`),
          fetch("/api/admin/bnhub-sales-assist"),
          fetch("/api/admin/bnhub-promotions/orders?take=50"),
        ]);
        if (!dashRes.ok) throw new Error("Dashboard load failed");
        const dash = await dashRes.json();
        setSnapshot(dash.snapshot);
        if (salesRes.ok) {
          const s = await salesRes.json();
          setSales(s.entries ?? []);
        }
        if (ordRes.ok) {
          const o = await ordRes.json();
          setOrders(o.orders ?? []);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Refresh failed");
      }
    });
  }

  async function runReminders() {
    setErr(null);
    try {
      const res = await fetch("/api/admin/bnhub-automation/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ olderThanDays: 3, limit: 50 }),
      });
      if (!res.ok) throw new Error("Reminder run failed");
      await refreshAll(days);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Reminders failed");
    }
  }

  async function loadContent() {
    setErr(null);
    try {
      const res = await fetch("/api/admin/bnhub-revenue-content");
      if (!res.ok) throw new Error("Content load failed");
      const data = await res.json();
      setContentJson(JSON.stringify(data.pack, null, 2));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Content failed");
    }
  }

  async function addSalesRow(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const res = await fetch("/api/admin/bnhub-sales-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestEmail: newEmail, stage: newStage }),
      });
      if (!res.ok) throw new Error("Could not add entry");
      setNewEmail("");
      await refreshAll(days);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Add failed");
    }
  }

  async function patchSales(id: string, patch: Record<string, unknown>) {
    setErr(null);
    try {
      const res = await fetch(`/api/admin/bnhub-sales-assist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Update failed");
      await refreshAll(days);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!payerId.trim()) {
      setErr("Payer user id required");
      return;
    }
    try {
      const res = await fetch("/api/admin/bnhub-promotions/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSku, payerUserId: payerId.trim(), markPaid }),
      });
      if (!res.ok) throw new Error("Order create failed");
      setPayerId("");
      await refreshAll(days);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Order failed");
    }
  }

  return (
    <div className="space-y-10 text-slate-100">
      {err ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{err}</div>
      ) : null}

      <section className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-400">
          Range (days)
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 30)}
            className="ml-2 w-24 rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-white"
          />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() => refreshAll(days)}
          className="rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-[#d4b456] disabled:opacity-50"
        >
          {pending ? "Loading…" : "Refresh metrics"}
        </button>
        <button
          type="button"
          onClick={runReminders}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          Run no-booking reminders
        </button>
        <button type="button" onClick={loadContent} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800">
          Load daily content pack
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Booking revenue (paid)" value={fmtMoney(snapshot.bookingRevenueCents)} sub={`${snapshot.completedBookingPaymentsCount} payments`} />
        <MetricCard label="Promotion revenue" value={fmtMoney(snapshot.promotionRevenueCents)} sub={`${snapshot.paidPromotionOrdersCount} orders`} />
        <MetricCard label="Grand total" value={fmtMoney(snapshot.grandTotalRevenueCents)} sub="Bookings + promotions" />
        <MetricCard
          label="Sales assist → booking"
          value={pct(snapshot.salesAssistConversionRate)}
          sub={`${snapshot.salesAssistConvertedCount} / ${snapshot.salesAssistEntriesCount} (in range)`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
          <h2 className="text-lg font-semibold text-white">Bookings</h2>
          <p className="mt-1 text-sm text-slate-400">Created in range: {snapshot.bookingsCreatedCount}</p>
          <p className="text-sm text-slate-400">Confirmed / completed (created in range): {snapshot.confirmedOrCompletedBookingsCount}</p>
        </div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
          <h2 className="text-lg font-semibold text-white">Referrals & automation</h2>
          <p className="mt-1 text-sm text-slate-400">Referral signups (range): {snapshot.referralSignupsInRange}</p>
          <p className="text-sm text-slate-400">Rewards issued (range): {snapshot.referralRewardsCountInRange}</p>
          <p className="text-sm text-slate-400">Automation events (range): {snapshot.automationEventsInRange}</p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Sales assist</h2>
          <form onSubmit={addSalesRow} className="flex flex-wrap gap-2">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Guest email"
              className="min-w-[200px] flex-1 rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
            />
            <select
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              className="rounded-md border border-slate-600 bg-slate-900 px-2 py-2 text-sm"
            >
              {["new", "contacted", "qualified", "negotiating", "won", "lost"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">
              Add
            </button>
          </form>
          <ul className="max-h-[420px] space-y-2 overflow-y-auto text-sm">
            {sales.map((row) => (
              <li key={row.id} className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <div className="font-medium text-slate-200">{row.guest?.email ?? row.guestEmail ?? "—"}</div>
                <div className="mt-1 text-xs text-slate-500">Stage: {row.stage}</div>
                {row.convertedBooking ? (
                  <div className="mt-1 text-xs text-emerald-400">Converted: {row.convertedBooking.id.slice(0, 8)}…</div>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs text-[#C9A646] hover:underline"
                    onClick={() => {
                      const bookingId = window.prompt("Booking id to attach");
                      if (bookingId) void patchSales(row.id, { stage: "won", convertedBookingId: bookingId.trim() });
                    }}
                  >
                    Mark won + booking id
                  </button>
                  <button
                    type="button"
                    className="text-xs text-slate-400 hover:underline"
                    onClick={() => patchSales(row.id, { stage: "contacted" })}
                  >
                    Set contacted
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Promotion orders</h2>
          <form onSubmit={createOrder} className="space-y-2 rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
            <select
              value={planSku}
              onChange={(e) => setPlanSku(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
            >
              {planOptions.map((o) => (
                <option key={o.sku} value={o.sku}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              placeholder="Payer user UUID"
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={markPaid} onChange={(e) => setMarkPaid(e.target.checked)} />
              Mark paid (manual / before Stripe)
            </label>
            <button type="submit" className="rounded-md bg-[#C9A646] px-3 py-2 text-sm font-semibold text-slate-950">
              Create order
            </button>
          </form>
          <ul className="max-h-[360px] space-y-2 overflow-y-auto text-sm">
            {orders.map((o) => (
              <li key={o.id} className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <div className="font-medium text-slate-200">{o.plan.name}</div>
                <div className="text-xs text-slate-500">
                  {o.status} · {fmtMoney(o.amountCents)} · {o.payer.email ?? o.payer.id.slice(0, 8)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {contentJson ? (
        <section>
          <h2 className="text-lg font-semibold text-white">Content pack (JSON)</h2>
          <pre className="mt-2 max-h-80 overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-4 text-xs text-slate-300">{contentJson}</pre>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4 text-sm text-slate-400">
        <h2 className="text-base font-semibold text-slate-200">Readiness for real money</h2>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Booking revenue uses existing Payment records when status is COMPLETED.</li>
          <li>Promotion orders: set Stripe payment id on orders when checkout exists; until then use “Mark paid” for manual sales.</li>
          <li>Automation: signup and post-payment upsells enqueue in-app notifications; no-booking reminders are batch (admin button or cron).</li>
        </ul>
      </section>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#C9A646]/90">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}
