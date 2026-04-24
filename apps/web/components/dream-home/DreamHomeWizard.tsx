"use client";

import { useState } from "react";
import type { DreamHomeIntake, DreamHomeMatchResult } from "@/modules/dream-home/types/dream-home.types";
import { DreamHomeResults } from "./DreamHomeResults";

const TAG_OPTIONS = [
  { id: "multigenerational", label: "Multigenerational living" },
  { id: "prayer_meditation", label: "Dedicated prayer / meditation space" },
  { id: "extended_family", label: "Frequent extended family hosting" },
  { id: "formal_dining", label: "Formal dining / large meals" },
  { id: "kosher_kitchen", label: "Kosher / separate kitchen needs (describe in notes)" },
  { id: "other", label: "Other (describe in freeform)" },
];

type Props = { basePath: string };

const inputCls =
  "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-premium-gold/40";

export function DreamHomeWizard({ basePath }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [match, setMatch] = useState<DreamHomeMatchResult | null>(null);

  const [intake, setIntake] = useState<DreamHomeIntake>({
    householdSize: 3,
    workFromHome: true,
    guestFrequency: 0.3,
    maxBudget: 750000,
    city: "montreal",
    entertainingStyle: "moderate",
    privacyPreference: "balanced",
    noiseTolerance: "moderate",
    indoorOutdoorPriority: "balanced",
    culturalLifestyleTags: [],
  });

  const toggleTag = (id: string) => {
    setIntake((s) => {
      const t = s.culturalLifestyleTags ?? [];
      const on = t.includes(id);
      return {
        ...s,
        culturalLifestyleTags: on ? t.filter((x) => x !== id) : [...t, id],
      };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    setMatch(null);
    try {
      const pRes = await fetch("/api/dream-home/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
      });
      const pData = (await pRes.json()) as { ok?: boolean; profile?: unknown; source?: "ai" | "deterministic" };
      if (!pRes.ok || !pData.ok || !pData.profile) {
        setErr("Could not build your profile. Try again.");
        return;
      }
      const mRes = await fetch("/api/dream-home/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: pData.profile, source: pData.source ?? "deterministic" }),
      });
      const mData = (await mRes.json()) as {
        ok?: boolean;
        profile?: DreamHomeMatchResult["profile"];
        listings?: DreamHomeMatchResult["listings"];
        tradeoffs?: DreamHomeMatchResult["tradeoffs"];
        source?: DreamHomeMatchResult["source"];
      };
      if (!mRes.ok || !mData.ok || !mData.profile || !mData.listings || !mData.tradeoffs) {
        setErr("Could not load matching listings. Try again.");
        return;
      }
      setMatch({
        profile: mData.profile,
        listings: mData.listings,
        tradeoffs: mData.tradeoffs,
        source: mData.source === "ai" || mData.source === "deterministic" ? mData.source : "deterministic",
      });
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-slate-400">
        Preferences you enter here are kept explicit — we don&apos;t infer your background or nationality. Select only what
        matters to you.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-white">Household & guests</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Household size
              <input
                type="number"
                min={1}
                max={20}
                className={inputCls}
                value={intake.householdSize ?? ""}
                onChange={(e) => setIntake((s) => ({ ...s, householdSize: Number(e.target.value) }))}
              />
            </label>
            <label className="block text-sm text-slate-300">
              Guest / extended family frequency (0 = rare, 1 = very common)
              <input
                type="number"
                step={0.1}
                min={0}
                max={1}
                className={inputCls}
                value={intake.guestFrequency ?? ""}
                onChange={(e) => setIntake((s) => ({ ...s, guestFrequency: Number(e.target.value) }))}
              />
            </label>
            <label className="col-span-full block text-sm text-slate-300">
              Age groups & notes (optional)
              <textarea
                className={inputCls + " min-h-[72px]"}
                value={intake.ageGroupsNote ?? ""}
                onChange={(e) => setIntake((s) => ({ ...s, ageGroupsNote: e.target.value }))}
                placeholder="e.g. young children, parent visits monthly"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Work & lifestyle</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={!!intake.workFromHome}
                onChange={(e) => setIntake((s) => ({ ...s, workFromHome: e.target.checked }))}
              />
              Work from home
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={!!intake.hasPets}
                onChange={(e) => setIntake((s) => ({ ...s, hasPets: e.target.checked }))}
              />
              Pets
            </label>
          </div>
          <label className="mt-4 block text-sm text-slate-300">
            Pet details (optional)
            <input
              className={inputCls}
              value={intake.petNote ?? ""}
              onChange={(e) => setIntake((s) => ({ ...s, petNote: e.target.value }))}
            />
          </label>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Location & budget</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              City (e.g. montreal, laval, quebec, or part of a city name)
              <input
                className={inputCls}
                value={intake.city ?? ""}
                onChange={(e) => setIntake((s) => ({ ...s, city: e.target.value }))}
              />
            </label>
            <label className="block text-sm text-slate-300">
              Max budget (CAD, purchase)
              <input
                type="number"
                min={0}
                className={inputCls}
                value={intake.maxBudget ?? ""}
                onChange={(e) => setIntake((s) => ({ ...s, maxBudget: Number(e.target.value) }))}
              />
            </label>
            <label className="col-span-full block text-sm text-slate-300">
              Commute / radius notes
              <input
                className={inputCls}
                value={intake.commuteNote ?? ""}
                onChange={(e) => setIntake((s) => ({ ...s, commuteNote: e.target.value }))}
                placeholder="e.g. 30 min to downtown, near REM"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Space, privacy, noise & design</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Entertaining
              <select
                className={inputCls}
                value={intake.entertainingStyle ?? "unsure"}
                onChange={(e) =>
                  setIntake((s) => ({ ...s, entertainingStyle: e.target.value as DreamHomeIntake["entertainingStyle"] }))
                }
              >
                <option value="quiet">Quiet / intimate</option>
                <option value="moderate">Moderate</option>
                <option value="social">Frequent larger gatherings</option>
                <option value="unsure">Not sure</option>
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Privacy
              <select
                className={inputCls}
                value={intake.privacyPreference ?? "balanced"}
                onChange={(e) =>
                  setIntake((s) => ({ ...s, privacyPreference: e.target.value as DreamHomeIntake["privacyPreference"] }))
                }
              >
                <option value="high">High separation between spaces</option>
                <option value="balanced">Balanced</option>
                <option value="open">Open / loft-like</option>
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Noise
              <select
                className={inputCls}
                value={intake.noiseTolerance ?? "moderate"}
                onChange={(e) =>
                  setIntake((s) => ({ ...s, noiseTolerance: e.target.value as DreamHomeIntake["noiseTolerance"] }))
                }
              >
                <option value="quiet">Quiet</option>
                <option value="moderate">Moderate</option>
                <option value="lively">Lively / urban energy OK</option>
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Indoor / outdoor
              <select
                className={inputCls}
                value={intake.indoorOutdoorPriority ?? "balanced"}
                onChange={(e) =>
                  setIntake((s) => ({
                    ...s,
                    indoorOutdoorPriority: e.target.value as DreamHomeIntake["indoorOutdoorPriority"],
                  }))
                }
              >
                <option value="indoor">Mostly indoor living</option>
                <option value="balanced">Balanced</option>
                <option value="outdoor">Yard, terrace, outdoor priority</option>
              </select>
            </label>
            <label className="col-span-full block text-sm text-slate-300">
              Cooking & dining (optional)
              <textarea
                className={inputCls + " min-h-[64px]"}
                value={intake.cookingHabits ?? ""}
                onChange={(e) => setIntake((s) => ({ ...s, cookingHabits: e.target.value }))}
                placeholder="e.g. big family meals, two cooks, frequent baking"
              />
            </label>
            <label className="col-span-full block text-sm text-slate-300">
              Accessibility (optional)
              <input
                className={inputCls}
                value={intake.accessibilityNeeds ?? ""}
                onChange={(e) => setIntake((s) => ({ ...s, accessibilityNeeds: e.target.value }))}
              />
            </label>
            <label className="col-span-full block text-sm text-slate-300">
              Design taste
              <input
                className={inputCls}
                value={intake.designTaste ?? ""}
                onChange={(e) => setIntake((s) => ({ ...s, designTaste: e.target.value }))}
                placeholder="e.g. modern, minimalist, warm traditional, mixed"
              />
            </label>
            <label className="col-span-full block text-sm text-slate-300">
              Architectural inspiration (optional)
              <input
                className={inputCls}
                value={intake.preferredArchitecturalInspiration ?? ""}
                onChange={(e) => setIntake((s) => ({ ...s, preferredArchitecturalInspiration: e.target.value }))}
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Lifestyle & layout — your choices</h2>
          <p className="mt-1 text-xs text-slate-500">Optional tags you select — never inferred from background.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TAG_OPTIONS.map((t) => {
              const on = intake.culturalLifestyleTags?.includes(t.id) ?? false;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition " +
                    (on
                      ? "border-premium-gold bg-premium-gold/15 text-white"
                      : "border-white/15 text-slate-300 hover:border-white/30")
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <label className="mt-4 block text-sm text-slate-300">
            Anything else we should know?
            <textarea
              className={inputCls + " min-h-[80px]"}
              value={intake.freeform ?? ""}
              onChange={(e) => setIntake((s) => ({ ...s, freeform: e.target.value }))}
              placeholder="E.g. need two home offices, sound insulation, basement suite…"
            />
          </label>
        </section>

        {err && <p className="text-sm text-rose-400">{err}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-premium-gold px-8 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Building…" : "Build profile & see listings"}
        </button>
      </form>

      {match && <DreamHomeResults result={match} basePath={basePath} />}
    </div>
  );
}
