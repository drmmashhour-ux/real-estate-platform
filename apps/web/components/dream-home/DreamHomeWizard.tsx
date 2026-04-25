"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  DreamHomeMatchResult,
  DreamHomeProfile,
  DreamHomeQuestionnaireInput,
} from "@/modules/dream-home/types/dream-home.types";
import { DreamHomeStepHousehold } from "./DreamHomeStepHousehold";
import { DreamHomeStepLifestyle } from "./DreamHomeStepLifestyle";
import { DreamHomeStepBudgetLocation } from "./DreamHomeStepBudgetLocation";
import { DreamHomeStepPreferences } from "./DreamHomeStepPreferences";
import { DreamHomeProfileView } from "./DreamHomeProfileView";
import { DreamHomeResults } from "./DreamHomeResults";

const STEPS = ["Household", "Lifestyle", "Place & budget", "Preferences"];

type Props = { basePath: string };

/** Sparse defaults: partial / sparse answers still produce a valid profile. */
const defaultQ: Partial<DreamHomeQuestionnaireInput> = {
  guestsFrequency: "medium",
  privacyPreference: "medium",
  hostingPreference: "medium",
  kitchenPriority: "medium",
  outdoorPriority: "medium",
  commutePriority: "medium",
  noiseTolerance: "medium",
  specialSpaces: [],
  stylePreferences: [],
  lifestyleTags: [],
  mustHaves: [],
  dealBreakers: [],
  accessibilityNeeds: [],
};

export function DreamHomeWizard({ basePath }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  /** Built by POST /api/dream-home/profile (kept for retries + spec: profile + results). */
  const [profile, setProfile] = useState<DreamHomeProfile | null>(null);
  /** Full match output from POST /api/dream-home/match. */
  const [result, setResult] = useState<DreamHomeMatchResult | null>(null);
  const [q, setQ] = useState<Partial<DreamHomeQuestionnaireInput>>(defaultQ);

  const onChange = useCallback((p: Partial<DreamHomeQuestionnaireInput>) => {
    setQ((s) => ({ ...s, ...p }));
  }, []);

  const persist = useCallback(async () => {
    try {
      await fetch("/api/dream-home/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, questionnaire: q, updatedAt: new Date().toISOString() }),
      });
    } catch {
      /* best-effort */
    }
  }, [step, q]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/dream-home/session", { method: "GET" });
        const d = (await r.json()) as { ok?: boolean; session?: { step?: number; questionnaire?: Partial<DreamHomeQuestionnaireInput> } };
        if (d.ok && d.session?.questionnaire) {
          setQ((s) => ({ ...s, ...d.session!.questionnaire }));
          if (d.session!.step != null) {
            setStep(Math.min(d.session!.step, STEPS.length - 1));
          }
        }
      } catch {
        /* */
      }
    })();
  }, []);

  const runMatchFromProfile = useCallback(
    async (built: DreamHomeProfile, source: "ai" | "deterministic") => {
      const mRes = await fetch("/api/dream-home/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: built, source }),
      });
      const mData = (await mRes.json()) as {
        ok?: boolean;
        profile?: DreamHomeMatchResult["profile"];
        listings?: DreamHomeMatchResult["listings"];
        tradeoffs?: DreamHomeMatchResult["tradeoffs"];
        source?: DreamHomeMatchResult["source"];
        warnings?: string[];
        playbookAssignment?: DreamHomeMatchResult["playbookAssignment"];
      };
      if (!mRes.ok || !mData.ok || !mData.profile) {
        setErr("Could not load matching listings. Try again.");
        return false;
      }
      setResult({
        profile: mData.profile,
        listings: mData.listings ?? [],
        tradeoffs: mData.tradeoffs ?? [],
        source: mData.source === "ai" || mData.source === "deterministic" ? mData.source : "deterministic",
        warnings: mData.warnings,
        playbookAssignment: mData.playbookAssignment ?? null,
      });
      setErr(null);
      return true;
    },
    [],
  );

  const runMatch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setErr(null);
      setLoading(true);
      setResult(null);
      setProfile(null);
      try {
        const pRes = await fetch("/api/dream-home/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(q),
        });
        const pData = (await pRes.json()) as { ok?: boolean; profile?: DreamHomeProfile; source?: "ai" | "deterministic" };
        if (!pRes.ok || !pData.ok || !pData.profile) {
          setErr("Could not build your profile. Check inputs and try again.");
          return;
        }
        setProfile(pData.profile);
        const source = pData.source === "ai" || pData.source === "deterministic" ? pData.source : "deterministic";
        const ok = await runMatchFromProfile(pData.profile, source);
        if (ok) {
          await persist();
        }
      } catch {
        setErr("Network error. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [q, persist, runMatchFromProfile],
  );

  const retryMatchOnly = useCallback(async () => {
    if (!profile) {
      return;
    }
    setErr(null);
    setLoading(true);
    setResult(null);
    try {
      const ok = await runMatchFromProfile(profile, "deterministic");
      if (ok) {
        await persist();
      }
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [profile, persist, runMatchFromProfile]);

  return (
    <div>
      <p className="text-sm text-slate-400">
        Preferences you enter are explicit only — we don&apos;t infer nationality, background, or protected characteristics.
      </p>

      <ol className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={
              "rounded-full border px-2 py-0.5 " +
              (i === step ? "border-premium-gold/60 text-premium-gold" : "border-white/10 text-slate-500")
            }
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {!result ? (
        <div>
          {profile && err ? (
            <div className="mt-8 space-y-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
              <p className="text-sm text-rose-300">{err}</p>
              <p className="text-xs text-slate-400">
                Your profile was built successfully. You can retry loading listings or edit your answers.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={retryMatchOnly}
                  disabled={loading}
                  className="rounded-full bg-premium-gold/90 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {loading ? "…" : "Retry listing search"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setProfile(null);
                    setErr(null);
                  }}
                  className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-200 disabled:opacity-50"
                >
                  Edit my answers
                </button>
              </div>
              <DreamHomeProfileView profile={profile} />
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (step < 3) {
                  setStep((s) => s + 1);
                  await persist();
                } else {
                  await runMatch(e);
                }
              }}
              className="mt-8 space-y-10"
            >
              {step === 0 && <DreamHomeStepHousehold value={q} onChange={onChange} />}
              {step === 1 && <DreamHomeStepLifestyle value={q} onChange={onChange} />}
              {step === 2 && <DreamHomeStepBudgetLocation value={q} onChange={onChange} />}
              {step === 3 && <DreamHomeStepPreferences value={q} onChange={onChange} />}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={step === 0 || loading}
                  onClick={async () => {
                    setStep((s) => Math.max(0, s - 1));
                    await persist();
                  }}
                  className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-200 disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-premium-gold/90 px-6 py-2 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50"
                >
                  {step === 3 ? "Generate my dream home profile & show matches" : "Next"}
                </button>
                <button
                  type="button"
                  onClick={runMatch}
                  disabled={loading}
                  className="rounded-full border border-premium-gold/50 px-5 py-2 text-sm text-premium-gold disabled:opacity-50"
                >
                  {loading ? "…" : "Show my matches now"}
                </button>
              </div>

              {err ? <p className="text-sm text-rose-400">{err}</p> : null}
            </form>
          )}
        </div>
      ) : null}

      {result ? (
        <DreamHomeResults
          result={result}
          basePath={basePath}
          onRefine={() => {
            setResult(null);
            setProfile(null);
            setStep(0);
          }}
        />
      ) : null}
    </div>
  );
}
