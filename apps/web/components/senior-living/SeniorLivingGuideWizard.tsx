"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSeniorLivingAccessibility } from "./SeniorLivingAccessibilityProvider";

export function SeniorLivingGuideWizard(props: { locale: string; country: string }) {
  const base = `/${props.locale}/${props.country}`;
  const router = useRouter();
  const { familyHelperMode, setFamilyHelperMode } = useSeniorLivingAccessibility();

  const [step, setStep] = useState(1);
  const [who, setWho] = useState<"ME" | "PARENT" | "OTHER" | "">("");
  const [independence, setIndependence] = useState<"FULL" | "SOME" | "FULL_CARE" | "">("");
  const [budgetPreset, setBudgetPreset] = useState<string>("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function mobilityMedicalFromIndependence(): { mobilityLevel: string; medicalNeeds: string } {
    if (independence === "FULL") return { mobilityLevel: "INDEPENDENT", medicalNeeds: "NONE" };
    if (independence === "SOME") return { mobilityLevel: "LIMITED", medicalNeeds: "LIGHT" };
    return { mobilityLevel: "DEPENDENT", medicalNeeds: "HEAVY" };
  }

  function budgetNumber(): number | undefined {
    switch (budgetPreset) {
      case "under3500":
        return 3200;
      case "3500_5500":
        return 4500;
      case "5500_8000":
        return 6750;
      case "over8000":
        return 9500;
      default:
        return undefined;
    }
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const { mobilityLevel, medicalNeeds } = mobilityMedicalFromIndependence();
      const label =
        who === "ME" ? "Me"
        : who === "PARENT" ? "Parent"
        : who === "OTHER" ? "Someone else"
        : "Family member";

      const res = await fetch("/api/senior/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: label,
          preferredCity: city.trim() || undefined,
          budget: budgetNumber(),
          mobilityLevel,
          medicalNeeds,
        }),
      });
      const j = (await res.json()) as { profileId?: string; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Something went wrong");
      if (!j.profileId) throw new Error("No profile returned");
      router.push(`${base}/senior-living/results?profileId=${encodeURIComponent(j.profileId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const showFamilyHints = familyHelperMode;
  const step4Ready = who && independence && budgetPreset;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link href={`${base}/senior-living`} className="inline-block font-semibold text-teal-800 underline">
        ← Back to home
      </Link>

      <div className="mt-8 rounded-xl border-2 border-neutral-800 bg-neutral-50 p-5">
        <label className="flex cursor-pointer items-start gap-4 text-lg font-semibold text-neutral-900">
          <input
            type="checkbox"
            checked={familyHelperMode}
            onChange={(e) => setFamilyHelperMode(e.target.checked)}
            className="mt-1 h-7 w-7 shrink-0 accent-teal-700"
          />
          <span>
            I am helping someone decide
            {showFamilyHints ?
              <span className="mt-2 block text-base font-normal text-neutral-800">
                We show clearer explanations and tips for comparing places.
              </span>
            : null}
          </span>
        </label>
      </div>

      <div className="mt-10">
        <p className="text-sm font-bold uppercase tracking-wide text-neutral-700">
          Step {step} of 4
        </p>

        {step === 1 && (
          <div className="sl-card mt-4">
            <h2 className="mt-1">Who is this for?</h2>
            <div className="mt-6 flex flex-col gap-4">
              {(
                [
                  ["ME", "Me"],
                  ["PARENT", "My parent"],
                  ["OTHER", "Someone else"],
                ] as const
              ).map(([val, lab]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setWho(val)}
                  className={`sl-btn-secondary sl-btn-block-mobile min-h-[56px] text-left ${who === val ? "ring-4 ring-teal-600" : ""}`}
                >
                  {lab}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!who}
              onClick={() => setStep(2)}
              className="sl-btn-primary sl-btn-block-mobile mt-10 min-h-[56px] w-full disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="sl-card mt-4">
            <h2 className="mt-1">Level of independence</h2>
            <p className="mt-3 sl-text-muted">
              Pick what fits best today. You can change your mind later.
            </p>
            <div className="mt-6 flex flex-col gap-4">
              {(
                [
                  ["FULL", "Fully independent"],
                  ["SOME", "Needs some help"],
                  ["FULL_CARE", "Needs full care"],
                ] as const
              ).map(([val, lab]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setIndependence(val)}
                  className={`sl-btn-secondary sl-btn-block-mobile min-h-[56px] text-left ${independence === val ? "ring-4 ring-teal-600" : ""}`}
                >
                  {lab}
                </button>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={() => setStep(1)} className="sl-btn-secondary sl-btn-block-mobile min-h-[56px] flex-1">
                Back
              </button>
              <button
                type="button"
                disabled={!independence}
                onClick={() => setStep(3)}
                className="sl-btn-primary sl-btn-block-mobile min-h-[56px] flex-1 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="sl-card mt-4">
            <h2 className="mt-1">Monthly budget range</h2>
            <p className="mt-3 sl-text-muted">Rough range in Canadian dollars per month.</p>
            <div className="mt-6 flex flex-col gap-4">
              {(
                [
                  ["under3500", "Under $3,500"],
                  ["3500_5500", "$3,500 – $5,500"],
                  ["5500_8000", "$5,500 – $8,000"],
                  ["over8000", "Over $8,000"],
                ] as const
              ).map(([val, lab]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBudgetPreset(val)}
                  className={`sl-btn-secondary sl-btn-block-mobile min-h-[56px] ${budgetPreset === val ? "ring-4 ring-teal-600" : ""}`}
                >
                  {lab}
                </button>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={() => setStep(2)} className="sl-btn-secondary sl-btn-block-mobile min-h-[56px] flex-1">
                Back
              </button>
              <button
                type="button"
                disabled={!budgetPreset}
                onClick={() => setStep(4)}
                className="sl-btn-primary sl-btn-block-mobile min-h-[56px] flex-1 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="sl-card mt-4">
            <h2 className="mt-1">Preferred city</h2>
            <label htmlFor="guide-city" className="mt-6 block font-semibold">
              City or area (optional)
            </label>
            <input
              id="guide-city"
              className="sl-input mt-2 w-full"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Example: Montreal"
              autoComplete="address-level2"
            />
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={() => setStep(3)} className="sl-btn-secondary sl-btn-block-mobile min-h-[56px] flex-1">
                Back
              </button>
              <button
                type="button"
                disabled={busy || !step4Ready}
                onClick={() => void finish()}
                className="sl-btn-primary sl-btn-block-mobile min-h-[56px] flex-1 disabled:opacity-50"
              >
                {busy ? "Finding places…" : "See results"}
              </button>
            </div>
            {error ?
              <p className="mt-4 font-semibold text-red-800" role="alert">
                {error}
              </p>
            : null}
          </div>
        )}
      </div>
    </div>
  );
}
