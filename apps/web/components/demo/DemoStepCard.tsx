import type { DemoTrainingStep } from "./demo-training-data";

export type DemoStepCardProps = {
  step: DemoTrainingStep;
  /** Current step in practice mode — adds focus ring and cue */
  isActive?: boolean;
  practiceMode?: boolean;
};

/**
 * Single step in the LECIPM guided demo — title, script, on-screen action, visual cue.
 */
export function DemoStepCard({ step, isActive = false, practiceMode = false }: DemoStepCardProps) {
  return (
    <article
      data-demo-step={step.id}
      className={`rounded-2xl border bg-white/[0.03] p-5 transition-all duration-300 sm:p-6 ${
        practiceMode && isActive
          ? "border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_32px_rgba(251,191,36,0.12)] ring-2 ring-amber-400/50"
          : "border-white/10"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
              practiceMode && isActive ? "bg-amber-500/25 text-amber-200" : "bg-white/10 text-zinc-300"
            }`}
          >
            {step.stepNumber}
          </span>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white">{step.title}</h3>
            {step.visualCue ? (
              <span className="mt-1 inline-block rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {step.visualCue}
              </span>
            ) : null}
          </div>
        </div>
        {practiceMode && isActive ? (
          <span className="animate-pulse rounded-lg bg-amber-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">
            Étape en cours
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-base leading-relaxed text-zinc-200">{step.script}</p>

      {(step.show || step.action || step.trigger) && (
        <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
          {step.show ? (
            <div>
              <dt className="font-semibold text-[#D4AF37]/90">À l’écran</dt>
              <dd className="text-zinc-400">{step.show}</dd>
            </div>
          ) : null}
          {step.trigger ? (
            <div>
              <dt className="font-semibold text-rose-300/90">Exemple déclencheur</dt>
              <dd className="text-zinc-400">{step.trigger}</dd>
            </div>
          ) : null}
          {step.action ? (
            <div
              className={
                practiceMode && isActive
                  ? "rounded-lg bg-amber-500/10 px-3 py-2 ring-1 ring-amber-500/30"
                  : ""
              }
            >
              <dt className="font-semibold text-emerald-300/90">Où cliquer / geste</dt>
              <dd className="text-zinc-300">{step.action}</dd>
            </div>
          ) : null}
        </dl>
      )}
    </article>
  );
}
