"use client";

import { useMemo, useState } from "react";
import type { RenoclimatAssistantState } from "@/modules/green-ai/renoclimat-assistant/renoclimat-progress.service";
import {
  RENOCLIMAT_ASSISTANT_DISCLAIMER,
  RENOCLIMAT_CHECKLIST_ORDER,
  RENOCLIMAT_STEP_COUNT,
  RENOCLIMAT_STEPS,
  type RenoclimatChecklistKey,
} from "@/modules/green-ai/renoclimat-assistant/renoclimat-steps";

type Props = {
  locale: string;
  country: string;
  initial: RenoclimatAssistantState;
};

export function RenoclimatAssistantClient({ locale, country, initial }: Props) {
  const [state, setState] = useState<RenoclimatAssistantState>(initial);
  const [pending, setPending] = useState<RenoclimatChecklistKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progressPct = useMemo(
    () => Math.round((state.engine.completedCount / RENOCLIMAT_STEP_COUNT) * 100),
    [state.engine.completedCount],
  );

  async function commit(next: Partial<Record<RenoclimatChecklistKey, boolean>>, reminders?: boolean) {
    setError(null);
    try {
      const res = await fetch("/api/green/renoclimat-assistant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklist: Object.keys(next).length > 0 ? next : undefined,
          ...(typeof reminders === "boolean" ? { remindersEnabled: reminders } : {}),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(typeof j.error === "string" ? j.error : "Could not save progress.");
        return;
      }
      const json = (await res.json()) as RenoclimatAssistantState;
      setState(json);
    } catch {
      setError("Network error — try again.");
    }
  }

  async function toggle(key: RenoclimatChecklistKey, checked: boolean) {
    setPending(key);
    await commit({ [key]: checked });
    setPending(null);
  }

  async function setReminders(enabled: boolean) {
    await commit({}, enabled);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Guided pathway</p>
        <h1 className="font-serif text-3xl font-semibold text-white md:text-4xl">Rénoclimat assistant</h1>
        <p className="text-sm leading-relaxed text-premium-secondary">
          Follow these steps on official channels — this page is your checklist only.
        </p>
      </header>

      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-amber-100/95">
        {state.disclaimer ?? RENOCLIMAT_ASSISTANT_DISCLAIMER}
      </div>

      <section className="card-premium p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Progress</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-premium-secondary">
            <input
              type="checkbox"
              className="rounded border-white/20 bg-black/40"
              checked={state.remindersEnabled}
              onChange={(e) => void setReminders(e.target.checked)}
            />
            Email / in-app reminders for next steps
          </label>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-6 grid grid-cols-5 gap-2">
          {RENOCLIMAT_STEPS.map((s) => {
            const done = state.engine.allComplete || s.step < state.engine.currentStep;
            const current = !state.engine.allComplete && s.step === state.engine.currentStep;
            return (
              <div
                key={s.step}
                className={`rounded-xl border px-2 py-3 text-center text-[11px] font-semibold leading-tight sm:text-xs ${
                  current
                    ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100"
                    : done
                      ? "border-white/10 bg-white/[0.06] text-slate-200"
                      : "border-white/5 bg-black/30 text-slate-500"
                }`}
              >
                <span className="block text-[10px] font-normal uppercase tracking-wide text-premium-secondary">
                  Step {s.step}
                </span>
                {s.label}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card-premium p-6">
        <h2 className="text-lg font-semibold text-white">Next action</h2>
        <p className="mt-3 text-lg font-medium leading-snug text-emerald-100">{state.engine.nextAction}</p>
        <ul className="mt-5 list-inside list-disc space-y-2 text-sm leading-relaxed text-premium-secondary">
          {state.engine.instructions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="card-premium p-6">
        <h2 className="text-lg font-semibold text-white">Checklist</h2>
        <p className="mt-1 text-sm text-premium-secondary">
          Check items when you have personally completed them on official channels — honor system for your own records.
        </p>
        <ul className="mt-6 space-y-5">
          {RENOCLIMAT_CHECKLIST_ORDER.map((key, idx) => {
            const meta = RENOCLIMAT_STEPS[idx];
            const checked = Boolean(state.checklist[key]);
            return (
              <li key={key} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <label className="flex cursor-pointer gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-white/20 bg-black/40"
                    checked={checked}
                    disabled={pending === key}
                    onChange={(e) => void toggle(key, e.target.checked)}
                  />
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-emerald-400/80">
                      Step {meta.step} · {meta.label}
                    </span>
                    <span className="mt-1 block text-sm text-slate-100">{meta.checklistTitle}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card-premium p-6">
        <h2 className="text-lg font-semibold text-white">Tips — documents, timing, pitfalls</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-premium-secondary">
          {state.engine.tips.map((t) => (
            <li key={t} className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">
              {t}
            </li>
          ))}
        </ul>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-3 pb-12">
        <a
          href={`/${locale}/${country}/evaluate`}
          className="rounded-xl bg-premium-gold px-4 py-2.5 text-sm font-bold text-[#0B0B0B]"
        >
          Green property evaluation
        </a>
        <a
          href={`/${locale}/${country}/dashboard/seller`}
          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5"
        >
          Seller hub
        </a>
      </div>
    </div>
  );
}
