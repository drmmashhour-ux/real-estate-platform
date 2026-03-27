"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DealDetailClient({
  dealId,
  priceCents,
}: {
  dealId: string;
  priceCents: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"deposit" | "closing" | null>(null);
  const [error, setError] = useState("");

  async function handlePayment(type: "deposit" | "closing_fee", amountCents: number) {
    setError("");
    setLoading(type === "deposit" ? "deposit" : "closing");
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`/api/deals/${dealId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType: type,
          amountCents,
          successUrl: `${base}/dashboard/deals/${dealId}`,
          cancelUrl: `${base}/dashboard/deals/${dealId}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  const depositCents = Math.round(priceCents * 0.1);
  const closingCents = Math.round(priceCents * 0.02);

  return (
    <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-medium text-slate-200">Pay deposit or closing fee</h2>
      <p className="mt-1 text-sm text-slate-400">
        Redirects to Stripe. After payment, the webhook will update milestones and deal status.
      </p>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handlePayment("deposit", depositCents)}
          disabled={!!loading}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {loading === "deposit" ? "Redirecting…" : `Pay deposit ($${(depositCents / 100).toFixed(0)})`}
        </button>
        <button
          type="button"
          onClick={() => handlePayment("closing_fee", closingCents)}
          disabled={!!loading}
          className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500 disabled:opacity-50"
        >
          {loading === "closing" ? "Redirecting…" : `Pay closing fee ($${(closingCents / 100).toFixed(0)})`}
        </button>
      </div>
    </section>
  );
}
