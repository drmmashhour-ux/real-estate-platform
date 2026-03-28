"use client";

type Props = {
  text: string;
  /** One clear next step — shown below the “why” copy. */
  nextStep?: string;
};

/** Short “why this strategy” explanation for client presentation mode. */
export function ScenarioWhyCard({ text, nextStep }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Why this scenario</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-200">{text}</p>
      {nextStep ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200/85">Your next step</p>
          <p className="mt-1.5 text-sm leading-relaxed text-emerald-50/95">{nextStep}</p>
        </div>
      ) : null}
    </div>
  );
}
