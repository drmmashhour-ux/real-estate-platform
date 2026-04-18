"use client";

import type { ReactNode } from "react";

export function StepForm({
  step,
  total,
  title,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  isLast,
}: {
  step: number;
  total: number;
  title: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isLast?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ds-border bg-ds-card p-6 shadow-ds-soft sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">
          Step {step} of {total}
        </p>
        <div className="h-1 flex-1 max-w-[120px] rounded-full bg-ds-border">
          <div
            className="h-full rounded-full bg-ds-gold transition-all"
            style={{ width: `${Math.min(100, (step / total) * 100)}%` }}
          />
        </div>
      </div>
      <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-ds-text sm:text-2xl">{title}</h2>
      <div className="mt-6 space-y-5">{children}</div>
      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {onBack ?
          <button
            type="button"
            onClick={onBack}
            className="min-h-[48px] rounded-xl border border-ds-border px-6 text-sm font-semibold text-ds-text-secondary transition hover:border-ds-gold/40 hover:text-ds-text"
          >
            {backLabel}
          </button>
        : <span />}
        {onNext ?
          <button
            type="button"
            onClick={onNext}
            className="min-h-[48px] rounded-xl bg-ds-gold px-8 text-sm font-semibold text-ds-bg shadow-ds-glow transition hover:brightness-110"
          >
            {isLast ? "Finish" : nextLabel}
          </button>
        : null}
      </div>
    </div>
  );
}
