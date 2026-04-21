"use client";

import { useState } from "react";
import type { EsgSalesPitchOutput } from "@/modules/esg-sales/esg-sales.engine";

type Props = {
  listingPayload: Record<string, unknown>;
  /** Unlock premium appendix-style tier when broker workspace allows it */
  brokerPremium?: boolean;
};

export function ListingEsgPitchPanel({ listingPayload, brokerPremium }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<EsgSalesPitchOutput | null>(null);

  async function generate() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/esg-sales/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...listingPayload,
          brokerPremium: brokerPremium === true,
          premiumBrokerTier: brokerPremium === true,
          tier: brokerPremium ? "premium" : "basic",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof json.error === "string" ? json.error : "Could not generate pitch.");
        setOut(null);
        return;
      }
      setOut(json as EsgSalesPitchOutput);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">Broker tool</p>
          <h2 className="mt-1 text-lg font-semibold text-white">ESG sales pitch</h2>
          <p className="mt-1 text-xs text-slate-400">{out?.positioning ?? "Turn ESG into a sales advantage."}</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Generating…" : "Generate ESG Pitch"}
        </button>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{out?.monetizationNote}</p>

      {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}

      {out ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/35 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Visual summary</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase text-slate-500">ESG score</p>
                <p className="font-serif text-2xl font-semibold text-emerald-200">{out.visualCard.esgScore}</p>
                <p className="text-xs text-slate-400">{out.visualCard.esgLabel}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500">Illustrative grants</p>
                <p className="font-serif text-2xl font-semibold text-emerald-200">
                  ${out.visualCard.illustrativeGrantCad.toLocaleString("en-CA")}
                </p>
                <p className="text-xs text-slate-400">CAD midpoint sum</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500">ROI headline</p>
                <p className="text-sm font-medium text-white">{out.visualCard.roiHeadline}</p>
                <p className="text-xs text-slate-400">
                  Green badge preview: {out.visualCard.badgeEligible ? "Eligible (tier rules)" : "Not shown"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seller pitch</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{out.sellerPitch}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Buyer pitch</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{out.buyerPitch}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ROI bullets</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-300">
              {out.roiBullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">{out.disclaimers.pitch}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Uses your listing basics + illustrative incentives — always confirm incentives with official programs.
        </p>
      )}
    </div>
  );
}
