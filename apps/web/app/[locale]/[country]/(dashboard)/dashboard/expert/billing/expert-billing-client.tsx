"use client";

import { useCallback, useEffect, useState } from "react";

const GOLD = "var(--color-premium-gold)";
const CARD = "#141414";

type BillingPayload = {
  plan: string;
  subscriptionActive: boolean;
  stripeStatus: string | null;
  nextBillingDate: string | null;
  leadsUsedThisMonth: number;
  monthlyLeadCap: number;
  creditsRemaining: number | null;
  totalEarningsDollars: number;
  totalCommissionsPaidDollars: number;
  dealsClosed: number;
  payoutTransferredCents: number;
  recentInvoices: Array<{
    id: string;
    type: string;
    amountCents: number;
    currency: string;
    description: string | null;
    createdAt: string;
  }>;
};

export function ExpertBillingClient() {
  const [data, setData] = useState<BillingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [creditQty, setCreditQty] = useState(10);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/mortgage/expert/billing", { credentials: "include" });
      if (!res.ok) {
        setError("Could not load billing.");
        return;
      }
      const j = (await res.json()) as BillingPayload;
      setData(j);
    } catch {
      setError("Could not load billing.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function startSubscribe(plan: "basic" | "pro" | "premium" | "ambassador") {
    setLoadingCheckout(`sub:${plan}`);
    try {
      const res = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });
      const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !j.url) {
        setError(j.error ?? "Checkout failed.");
        return;
      }
      window.location.href = j.url;
    } finally {
      setLoadingCheckout(null);
    }
  }

  async function buyCredits() {
    setLoadingCheckout("credits");
    try {
      const res = await fetch("/api/stripe/mortgage-expert/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity: creditQty }),
      });
      const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !j.url) {
        setError(j.error ?? "Checkout failed.");
        return;
      }
      window.location.href = j.url;
    } finally {
      setLoadingCheckout(null);
    }
  }

  async function connectPayouts() {
    setLoadingCheckout("connect");
    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !j.url) {
        setError(j.error ?? "Could not start Connect onboarding.");
        return;
      }
      window.location.href = j.url;
    } finally {
      setLoadingCheckout(null);
    }
  }

  if (error && !data) {
    return (
      <p className="text-red-400" style={{ color: "#f87171" }}>
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="text-neutral-400">Loading…</p>;
  }

  const monthlyLabel = data.monthlyLeadCap < 0 ? "Unlimited" : String(data.monthlyLeadCap);
  const creditsLabel = data.creditsRemaining == null ? "Not on pay-per-lead" : String(data.creditsRemaining);

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-2 text-sm text-red-200">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-5" style={{ background: CARD }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
            Plan & subscription
          </p>
          <p className="mt-3 text-2xl font-bold text-white">
            {data.plan === "basic"
              ? "Gold"
              : data.plan === "pro"
                ? "Platinum"
                : data.plan === "premium"
                  ? "Platinum+"
                  : data.plan === "ambassador"
                    ? "Ambassador"
                    : data.plan}
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Status: {data.subscriptionActive ? "Active entitlements" : "Free / inactive"}{" "}
            {data.stripeStatus ? `· Stripe: ${data.stripeStatus}` : ""}
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Next billing: {data.nextBillingDate ? new Date(data.nextBillingDate).toLocaleDateString() : "—"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-50 sm:text-sm"
              disabled={Boolean(loadingCheckout)}
              onClick={() => void startSubscribe("basic")}
            >
              {loadingCheckout === "sub:basic" ? "Redirecting…" : "Gold"}
            </button>
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-black disabled:opacity-50 sm:text-sm"
              style={{ background: GOLD }}
              disabled={Boolean(loadingCheckout)}
              onClick={() => void startSubscribe("pro")}
            >
              {loadingCheckout === "sub:pro" ? "Redirecting…" : "Platinum"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium text-white hover:bg-white/5 disabled:opacity-50 sm:text-sm"
              disabled={Boolean(loadingCheckout)}
              onClick={() => void startSubscribe("premium")}
            >
              {loadingCheckout === "sub:premium" ? "Redirecting…" : "Platinum+"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-premium-gold/50 px-3 py-2 text-xs font-bold text-premium-gold hover:bg-premium-gold/10 disabled:opacity-50 sm:text-sm"
              disabled={Boolean(loadingCheckout)}
              onClick={() => void startSubscribe("ambassador")}
            >
              {loadingCheckout === "sub:ambassador" ? "Redirecting…" : "Ambassador"}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Stripe price IDs must be set for each tier you sell. See env{" "}
            <code className="text-neutral-400">STRIPE_PRICE_MORTGAGE_*_MONTHLY</code>.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 p-5" style={{ background: CARD }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
            Lead usage & credits
          </p>
          <p className="mt-3 text-lg text-white">
            This month:{" "}
            <span className="font-bold">
              {data.leadsUsedThisMonth} / {monthlyLabel}
            </span>
          </p>
          <p className="mt-2 text-sm text-neutral-400">Credits remaining: {creditsLabel}</p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="text-xs text-neutral-500">
              Pack size
              <input
                type="number"
                min={1}
                max={500}
                value={creditQty}
                onChange={(e) => setCreditQty(Number(e.target.value) || 1)}
                className="ml-2 w-20 rounded border border-white/20 bg-black px-2 py-1 text-sm text-white"
              />
            </label>
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              style={{ background: GOLD }}
              disabled={Boolean(loadingCheckout)}
              onClick={() => void buyCredits()}
            >
              {loadingCheckout === "credits" ? "Redirecting…" : "Buy credits"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-5 sm:col-span-2" style={{ background: CARD }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
            Earnings & payouts
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-neutral-500">Total expert share (closed deals)</p>
              <p className="text-2xl font-bold text-white">${data.totalEarningsDollars.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Platform commission (30%)</p>
              <p className="text-2xl font-bold text-white">
                ${data.totalCommissionsPaidDollars.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Deals closed · transferred payouts</p>
              <p className="text-2xl font-bold text-white">
                {data.dealsClosed} · ${(data.payoutTransferredCents / 100).toFixed(2)}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5 disabled:opacity-50"
            disabled={Boolean(loadingCheckout)}
            onClick={() => void connectPayouts()}
          >
            {loadingCheckout === "connect" ? "Opening Stripe…" : "Connect Stripe for payouts"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 p-5" style={{ background: CARD }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
          Premium revenue add-ons
        </p>
        <p className="mt-2 text-sm text-neutral-400">
          Optional placements to maximize visibility and lead flow. Contact platform ops to enable on your profile —
          invoiced separately when you subscribe.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-neutral-300">
          <li className="rounded-lg border border-white/10 p-3">
            <p className="font-semibold text-white">Priority listing</p>
            <p className="mt-1 text-xs text-neutral-500">Higher placement in the expert directory.</p>
          </li>
          <li className="rounded-lg border border-white/10 p-3">
            <p className="font-semibold text-white">Featured expert</p>
            <p className="mt-1 text-xs text-neutral-500">Featured badge & spotlight on /mortgage.</p>
          </li>
          <li className="rounded-lg border border-white/10 p-3">
            <p className="font-semibold text-white">Premium placement</p>
            <p className="mt-1 text-xs text-neutral-500">Top-of-funnel placement for high-intent visitors.</p>
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 p-5" style={{ background: CARD }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
          Invoices
        </p>
        {data.recentInvoices.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No invoices yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {data.recentInvoices.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2"
              >
                <span className="text-neutral-300">
                  {inv.type} · {(inv.description ?? "").slice(0, 80)}
                  {inv.description && inv.description.length > 80 ? "…" : ""}
                </span>
                <span className="font-medium text-white">
                  ${(inv.amountCents / 100).toFixed(2)} {inv.currency.toUpperCase()}
                </span>
                <a
                  href={`/api/mortgage/expert/billing/invoices/${inv.id}`}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: GOLD }}
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
