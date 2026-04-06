"use client";

import Link from "next/link";
import { StepAI } from "@/components/host/steps/StepAI";
import { StepBasic } from "@/components/host/steps/StepBasic";
import { StepPhotos } from "@/components/host/steps/StepPhotos";
import { StepPricing } from "@/components/host/steps/StepPricing";
import { StepReview } from "@/components/host/steps/StepReview";
import { useListingWizard } from "@/stores/useListingWizard";

const STEP_LABELS = ["Basic", "Photos", "Pricing", "AI fill", "Review"];

export function HostListingWizard() {
  const step = useListingWizard((s) => s.step);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black px-4 pb-16 pt-8 text-white sm:px-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/dashboard/host" className="text-sm text-emerald-400 hover:underline">
            ← Host home
          </Link>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">~1 min</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">New listing</h1>
        <p className="mt-1 text-sm text-slate-400">Five quick steps — AI does the heavy typing.</p>

        <div className="mt-6 flex gap-1">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div
                key={label}
                className={`h-1 flex-1 rounded-full ${done || active ? "bg-emerald-500" : "bg-white/10"}`}
                title={label}
              />
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          Step {step} of 5 · {STEP_LABELS[step - 1]}
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/40 backdrop-blur sm:p-6">
          {step === 1 ? <StepBasic /> : null}
          {step === 2 ? <StepPhotos /> : null}
          {step === 3 ? <StepPricing /> : null}
          {step === 4 ? <StepAI /> : null}
          {step === 5 ? <StepReview /> : null}
        </div>
      </div>
    </main>
  );
}
