import { FUNDRAISING_EXECUTION } from "@/modules/investor/fundraising-execution.config";

const ex = FUNDRAISING_EXECUTION;

/** Static execution checklist — no revenue promises; labels internal metrics honestly. */
export function FundraisingExecutionPlaybook() {
  return (
    <div className="rounded-2xl border border-violet-500/30 bg-slate-900/50 p-6 text-sm text-slate-300">
      <h2 className="text-base font-semibold text-white">Execution playbook ($100k–$500k)</h2>
      <p className="mt-1 text-xs text-slate-500">Stage: {ex.roundLabel}. Targets: min / max / default in config; override with FUNDRAISING_TARGET_CAD (100000–500000).</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-300">Materials</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>
              <span className="text-slate-200">Pitch deck</span> — {ex.materials.pitchDeck}
            </li>
            <li>
              <span className="text-slate-200">Demo</span> — {ex.materials.demo}
            </li>
            <li>
              <span className="text-slate-200">Key metrics</span> — {ex.materials.keyMetrics}
            </li>
            <li>
              <span className="text-slate-200">Roadmap</span> — {ex.materials.roadmap}
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-300">Outreach</h3>
          <p className="mt-2 text-slate-400">
            Build a list of {ex.outreach.investorListSizeMin}–{ex.outreach.investorListSizeMax} investors. Batch{" "}
            {ex.outreach.batchPerWeekMin}–{ex.outreach.batchPerWeekMax} / week. {ex.outreach.note}
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-300">Meetings (5+5)</h3>
          <p className="mt-2 text-slate-400">
            {ex.meeting.pitchMinutes}-minute pitch, then {ex.meeting.afterPitch}
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-300">Follow-ups</h3>
          <p className="mt-2 text-slate-400">
            Default reminder {ex.followUp.daysAfterTouchMin}–{ex.followUp.daysAfterTouchMax} days after a touch; system default scheduling uses {ex.followUp.defaultDays} days. Updates: {ex.followUp.shareUpdatePrompt}
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-300">Soft commitments</h3>
          <p className="mt-2 text-slate-400">{ex.softCommitments.note}</p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-300">Closing (real only)</h3>
          <p className="mt-2 text-slate-400">{ex.closing.whenToAccelerate}</p>
        </section>

        <section className="md:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-300">After wire</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>{ex.postClose.sendUpdate}</li>
            <li>{ex.postClose.onboardInvestors}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
