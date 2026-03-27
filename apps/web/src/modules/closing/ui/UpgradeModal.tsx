"use client";

import { useCallback, useState } from "react";
import { UpgradeBenefitsList } from "@/src/modules/closing/ui/UpgradeBenefitsList";
import { PricingCard } from "@/src/modules/closing/ui/PricingCard";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  /** Only show upgrade CTA after the user has had a value moment (e.g. first sim). */
  valueShown?: boolean;
  /** Fires when user clicks upgrade (funnel: upgrade_clicked). */
  onUpgradeIntent?: () => void;
};

export function UpgradeModal({
  open,
  title = "Unlock Pro",
  message,
  onClose,
  valueShown = true,
  onUpgradeIntent,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
    onUpgradeIntent?.();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/closing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout unavailable");
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
      }
    } catch {
      setError("Could not start checkout");
    } finally {
      setLoading(false);
    }
  }, [onUpgradeIntent]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        <UpgradeBenefitsList />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <PricingCard
            name="Free"
            priceLabel="$0"
            description="Limited simulations and drafts. Explore the product."
          />
          <PricingCard
            name="Pro"
            priceLabel="From $99/mo"
            description="Unlimited sims, negotiation tools, AI drafting."
            highlighted
            ctaLabel={loading ? "Opening checkout…" : "Upgrade now"}
            onSelect={valueShown ? startCheckout : undefined}
          />
        </div>
        {!valueShown ? (
          <p className="mt-3 text-xs text-slate-500">Complete a quick value action first — then you can upgrade in one tap.</p>
        ) : null}
        {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Not now
          </button>
          <a
            href="/pricing"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5"
            onClick={() => onUpgradeIntent?.()}
          >
            Compare plans
          </a>
        </div>
      </div>
    </div>
  );
}
