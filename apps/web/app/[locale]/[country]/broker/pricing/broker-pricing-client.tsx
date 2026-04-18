"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { BrokerFeeTransparency } from "@/components/pricing/BrokerFeeTransparency";
import { ComparisonTable } from "@/components/pricing/ComparisonTable";
import { ROIQuickTool } from "@/components/sales/ROIQuickTool";

type PlatformFeeTransparency = {
  brokerage: {
    payPerLeadCents: number;
    featuredListingMonthlyCents: number;
    promotedListingCents: number;
  };
  disclaimers: string[];
} | null;

export function BrokerPricingClient({
  platformFeeTransparency = null,
  showBrokerRoi = false,
}: {
  platformFeeTransparency?: PlatformFeeTransparency;
  showBrokerRoi?: boolean;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/broker/session", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && typeof json.plan === "string") setCurrentPlan(json.plan);
    })();
  }, []);

  const mockUpgrade = async () => {
    setBusy(true);
    try {
      const up = await fetch("/api/broker/mortgage/upgrade", {
        method: "POST",
        credentials: "include",
      });
      const json = await up.json().catch(() => ({}));
      if (!up.ok) {
        showToast(typeof json.error === "string" ? json.error : "Could not upgrade", "info");
        return;
      }
      showToast("You're on Pro — unlimited leads unlocked.", "success");
      router.push("/broker/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-center text-sm text-amber-100">
        <strong className="text-amber-50">New leads added daily</strong>
        <span className="text-amber-100/85"> — stay on Pro so you never miss serious investors.</span>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Mortgage brokers</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Pricing</h1>
        <p className="mt-3 text-lg text-slate-300">
          High-intent, qualified real estate leads — investors who already run ROI and cash-flow analysis on LECIPM.
        </p>
        <p className="mt-2 text-sm text-slate-500">Leads generated from real investment analysis.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold text-white">Free</h2>
          <p className="mt-2 text-sm text-slate-400">Start fast — see what&apos;s coming in.</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-slate-500" aria-hidden>
                ·
              </span>
              Limited leads — <strong className="text-slate-200">latest 3 requests only</strong>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-500" aria-hidden>
                ·
              </span>
              Full details on visible leads
            </li>
          </ul>
          <p className="mt-6 text-xs text-slate-500">Best for trying the pipeline.</p>
        </section>

        <section className="relative flex flex-col rounded-2xl border-2 border-premium-gold/50 bg-gradient-to-b from-[#14110a] to-[#0B0B0B] p-6 shadow-[0_0_40px_rgb(var(--premium-gold-channels) / 0.12)]">
          <span className="absolute right-4 top-4 rounded-full bg-premium-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0B0B0B]">
            Pro
          </span>
          <h2 className="text-xl font-bold text-white">Pro</h2>
          <p className="mt-2 text-sm text-[#d4c9a8]">For brokers who want every opportunity.</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-200">
            <li className="flex gap-2">
              <span className="text-premium-gold" aria-hidden>
                ✓
              </span>
              <strong>Unlimited leads</strong> — full history, no blur
            </li>
            <li className="flex gap-2">
              <span className="text-premium-gold" aria-hidden>
                ✓
              </span>
              Priority access to new assignments as volume grows
            </li>
            <li className="flex gap-2">
              <span className="text-premium-gold" aria-hidden>
                ✓
              </span>
              Status updates on every lead
            </li>
          </ul>
          {currentPlan === "pro" ? (
            <p className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-950/30 py-3 text-center text-sm font-medium text-emerald-100">
              You&apos;re on Pro — unlimited leads are active.
            </p>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void mockUpgrade()}
                className="btn-primary mt-6 w-full justify-center"
              >
                {busy ? "Processing…" : "Upgrade to Pro"}
              </button>
              <p className="mt-3 text-center text-[11px] text-slate-500">
                Mock checkout — no payment yet. Your account switches to Pro instantly.
              </p>
            </>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-6 text-center">
        <p className="text-base font-medium text-white">Why upgrade?</p>
        <p className="mt-2 text-sm text-slate-400">
          Investors on LECIPM already run ROI and cash-flow analysis — they&apos;re not cold traffic. Pro keeps you in
          front of every lead, not just the newest three.
        </p>
      </section>

      {platformFeeTransparency ? (
        <div className="space-y-6">
          <BrokerFeeTransparency
            brokerage={platformFeeTransparency.brokerage}
            disclaimers={platformFeeTransparency.disclaimers}
          />
          <div>
            <h2 className="text-lg font-semibold text-white">Fee stance</h2>
            <p className="mt-1 text-sm text-slate-500">
              We don&apos;t publish fake “vs competitor” savings. Checkout and CRM billing show line items; ROI tools use your inputs only.
            </p>
            <div className="mt-4">
              <ComparisonTable
                rows={[
                  {
                    label: "Mortgage leads (this page)",
                    lecipm: "Free vs Pro — as shown above",
                    notes: "Mock upgrade today; Stripe-backed billing when enabled for your workspace.",
                  },
                  {
                    label: "Residential CRM (when active)",
                    lecipm: "Pay-per-lead anchor + optional boosts",
                    notes: "See reference card — not a promise of deal volume.",
                  },
                  {
                    label: "Success / platform fee on commission",
                    lecipm: "Configurable in ROI model",
                    notes: "Use the estimate below — figures are illustrative, not guarantees.",
                  },
                ]}
              />
            </div>
          </div>
        </div>
      ) : null}

      {showBrokerRoi ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Model (not advice)</p>
          <ROIQuickTool />
        </div>
      ) : null}
    </div>
  );
}
