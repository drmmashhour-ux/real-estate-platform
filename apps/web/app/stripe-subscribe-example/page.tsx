"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

/**
 * Example: subscription Checkout via Price lookup_key (Stripe-hosted payment).
 * Set STRIPE_SUBSCRIPTION_LOOKUP_KEYS_ALLOWLIST and create a Price with matching lookup_key in Dashboard.
 */
function StripeSubscribeExampleInner() {
  const sp = useSearchParams();
  const checkout = sp.get("checkout");
  const [lookupKey, setLookupKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function startCheckout(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/subscription-by-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lookup_key: lookupKey.trim(),
          successPath: "/stripe-subscribe-example?checkout=success",
          cancelPath: "/stripe-subscribe-example?checkout=cancel",
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setErr(data.error ?? `HTTP ${res.status}`);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErr("No checkout URL returned");
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Stripe subscription (example)</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Uses <code className="rounded bg-muted px-1">POST /api/stripe/subscription-by-lookup</code> with a
        Dashboard Price <strong>lookup_key</strong>. Payment happens on Stripe Checkout only.
      </p>

      {checkout === "success" && (
        <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
          Checkout completed — confirm subscription in Stripe Dashboard and wire webhooks if you need entitlements.
        </p>
      )}
      {checkout === "cancel" && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Checkout cancelled.
        </p>
      )}

      <form onSubmit={startCheckout} className="mt-8 space-y-4">
        <label className="block text-sm font-medium">
          Price lookup_key
          <input
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. starter_monthly (must be in allowlist env)"
            value={lookupKey}
            onChange={(e) => setLookupKey(e.target.value)}
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !lookupKey.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Redirecting…" : "Checkout"}
        </button>
      </form>

      {err && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {err}
        </p>
      )}

      <section className="mt-10 text-xs text-muted-foreground space-y-2">
        <p>
          <strong>Setup:</strong> In Stripe → Product → Price, set <code>lookup_key</code>. In{" "}
          <code>apps/web/.env</code> add{" "}
          <code>STRIPE_SUBSCRIPTION_LOOKUP_KEYS_ALLOWLIST=your_lookup_key</code>.
        </p>
        <p>
          <strong>Already integrated:</strong> BNHub bookings, workspace billing, mortgage expert subscribe, and
          more under <code>app/api/stripe/</code>.
        </p>
      </section>
    </main>
  );
}

export default function StripeSubscribeExamplePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <StripeSubscribeExampleInner />
    </Suspense>
  );
}
