import Link from "next/link";
import type { SubsidyPipelineStage } from "@/modules/green-ai/pipeline/pipeline.types";
import {
  GREEN_UPGRADE_JOURNEY_STEPS,
  journeyActiveStepIndex,
  OFFICIAL_PROGRAM_NOTICE,
  PIPELINE_MONETIZATION,
} from "@/modules/green-ai/pipeline/upgrade-flow";
import { PIPELINE_POSITIONING, PIPELINE_SAFETY_NOTICE } from "@/modules/green-ai/pipeline/pipeline.types";
import { LECIPM_GREEN_VERIFIED_BADGE } from "@/modules/green-ai/green-certification";
import { AdvanceGreenProjectStageButton } from "./AdvanceGreenProjectStageButton";

export type GreenUpgradeJourneyProps = {
  locale: string;
  country: string;
  listingId: string | null;
  listingTitle: string | null;
  stage: SubsidyPipelineStage | null;
  estimatedGrantCad: number | null;
};

export function GreenUpgradeJourneySection({
  locale,
  country,
  listingId,
  listingTitle,
  stage,
  estimatedGrantCad,
}: GreenUpgradeJourneyProps) {
  const effectiveStage: SubsidyPipelineStage = stage ?? "ANALYSIS";
  const activeIndex = journeyActiveStepIndex(effectiveStage);

  return (
    <section className="card-premium overflow-hidden p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Green Upgrade Journey</h2>
          <p className="mt-1 text-sm text-premium-secondary">{PIPELINE_POSITIONING}</p>
        </div>
        {listingId ? (
          <AdvanceGreenProjectStageButton listingId={listingId} currentStage={effectiveStage} />
        ) : null}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-premium-secondary">
        {PIPELINE_SAFETY_NOTICE} {OFFICIAL_PROGRAM_NOTICE}
      </p>

      {listingTitle ? (
        <p className="mt-3 text-sm text-slate-200">
          Listing: <span className="font-medium text-white">{listingTitle}</span>
        </p>
      ) : null}

      {estimatedGrantCad != null ? (
        <p className="mt-2 text-sm text-emerald-200/90">
          Last illustrative grant estimate (CAD):{" "}
          <span className="font-semibold">{Math.round(estimatedGrantCad).toLocaleString("en-CA")}</span> — not a binding
          offer.
        </p>
      ) : null}

      <ol className="mt-6 grid gap-3 sm:grid-cols-5">
        {GREEN_UPGRADE_JOURNEY_STEPS.map((step, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex;
          return (
            <li
              key={step.id}
              className={`rounded-xl border px-3 py-3 text-center text-xs sm:text-sm ${
                current
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
                  : done
                    ? "border-white/10 bg-white/[0.04] text-slate-200"
                    : "border-white/5 bg-black/20 text-slate-500"
              }`}
            >
              <span className="block font-semibold">{step.label}</span>
              {current ? <span className="mt-1 block text-[10px] uppercase tracking-wide text-emerald-200/80">Current</span> : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/25 p-4 text-xs leading-relaxed text-premium-secondary">
        <p className="font-medium text-slate-200">Monetization surfaces (informational)</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>{PIPELINE_MONETIZATION.premiumReport}</li>
          <li>{PIPELINE_MONETIZATION.contractorLeads}</li>
          <li>{PIPELINE_MONETIZATION.listingBoost}</li>
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/${locale}/${country}/dashboard/green/assistant`}
          className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-2.5 text-center text-sm font-semibold text-emerald-100 hover:bg-emerald-500/15"
        >
          Rénoclimat assistant
        </Link>
        <Link
          href={`/${locale}/${country}/dashboard/green/forms`}
          className="rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm text-slate-200 hover:bg-white/5"
        >
          Rénoclimat form prep
        </Link>
        <Link
          href={`/${locale}/${country}/evaluate`}
          className="rounded-xl bg-premium-gold px-4 py-2.5 text-center text-sm font-bold text-[#0B0B0B] hover:bg-premium-gold"
        >
          Run green analysis
        </Link>
        <Link
          href="/dashboard/broker/green-professionals"
          className="rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm text-slate-200 hover:bg-white/5"
        >
          Browse green professionals
        </Link>
        {listingId ? (
          <Link
            href={`/${locale}/${country}/dashboard/seller/listings/${listingId}`}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm text-slate-200 hover:bg-white/5"
          >
            Listing settings
          </Link>
        ) : null}
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
        Completion unlocks narrative for internal badge presentation ({LECIPM_GREEN_VERIFIED_BADGE}) — never a government
        label. Listing boost cues require premium tier alignment and catalog rules.
      </p>
    </section>
  );
}
