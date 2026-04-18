"use client";

import Link from "next/link";
import { TrustStrip } from "@/components/shared/TrustStrip";
import { conversionEngineFlags } from "@/config/feature-flags";
import { buildInstantValueSummary } from "@/modules/conversion/instant-value.service";
import { recordBrokerPreviewCtaClick } from "@/modules/conversion/conversion-monitoring.service";
import {
  buildBrokerLeadPreview,
  type BrokerLeadPreviewPayload,
} from "@/modules/brokers/broker-lead-preview.service";

function qualityBadge(q: "high" | "medium" | "warm"): string {
  if (q === "high") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  if (q === "medium") return "bg-amber-500/15 text-amber-100 border-amber-500/35";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

type Props = {
  ctaHref?: string;
  /** When true, surfaces instant-value framing when conversion feature flags are on (additive). */
  conversionBoost?: boolean;
  /** Server or client-built anonymized preview; defaults to `buildBrokerLeadPreview()`. */
  leadPreviewPayload?: BrokerLeadPreviewPayload;
};

/**
 * Value preview for acquisition — anonymized samples only (not live PII).
 */
export function BrokerLeadPreview({
  ctaHref = "/signup",
  conversionBoost = false,
  leadPreviewPayload: payloadProp,
}: Props) {
  const payload = payloadProp ?? buildBrokerLeadPreview();
  const boosted =
    conversionBoost &&
    conversionEngineFlags.conversionUpgradeV1 &&
    conversionEngineFlags.instantValueV1;
  const instant = boosted ? buildInstantValueSummary({ page: "broker_preview", intent: "buy" }) : null;

  return (
    <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5">
      <h3 className="text-sm font-semibold text-emerald-100">
        {instant ? instant.headline : "Qualified lead preview (illustrative)"}
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        {instant
          ? instant.subheadline
          : "These are the types of qualified leads you can receive — masked until unlock; not performance guarantees."}
      </p>
      <p className="mt-2 text-[11px] text-slate-500">{payload.disclaimer}</p>
      {instant ? (
        <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
          {instant.insights.slice(0, 3).map((i) => (
            <li key={i.id} className="flex gap-2">
              <span className="text-premium-gold" aria-hidden>
                ·
              </span>
              <span>
                <span className="font-medium text-slate-200">{i.title}</span> — {i.description}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">
        Why each lead is worth attention
      </p>
      <ul className="mt-4 space-y-3">
        {payload.items.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-white">{s.intentLabel}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${qualityBadge(s.qualityBand)}`}
              >
                {s.qualityBand} signal
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              <span className="text-slate-500">Location:</span> {s.locationMask}
              {s.budgetBand ? (
                <>
                  {" "}
                  · <span className="text-slate-500">Budget:</span> {s.budgetBand}
                </>
              ) : null}
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">&ldquo;{s.messageExcerpt}&rdquo;</p>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <TrustStrip lines={instant?.trustLines} className="justify-start text-slate-500" />
      </div>
      <div className="mt-5">
        <Link
          href={ctaHref}
          onClick={() => {
            if (conversionEngineFlags.conversionUpgradeV1) {
              recordBrokerPreviewCtaClick({ surface: "broker_lead_preview" });
            }
          }}
          className="inline-flex rounded-lg bg-premium-gold px-4 py-2.5 text-sm font-bold text-black hover:opacity-95"
        >
          {instant?.ctaLabel ?? "Start receiving leads"}
        </Link>
      </div>
    </section>
  );
}
