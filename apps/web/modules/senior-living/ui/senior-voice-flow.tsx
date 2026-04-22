"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  locale: string;
  country: string;
  /** When true, shown first on the page (voice-first experiment). */
  compact?: boolean;
};

function budgetBandFromMonthly(n: number | null): string | undefined {
  if (n == null) return undefined;
  if (n < 4000) return "LOW";
  if (n < 7000) return "MID";
  return "HIGH";
}

/**
 * Voice capture → parse → AI profile → results. Keeps UI to one field + big action.
 */
export function SeniorVoiceFlow(props: Props) {
  const base = `/${props.locale}/${props.country}`;
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onGo = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const parseRes = await fetch("/api/senior/ai/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const pj = (await parseRes.json()) as {
        parsed?: {
          preferredCity?: string | null;
          budgetMonthly?: number | null;
          whoFor?: string | null;
          careNeedLevel?: string | null;
          urgencyLevel?: string | null;
        };
        spokenSummary?: string;
        error?: string;
      };
      if (!parseRes.ok) throw new Error(pj.error ?? "Could not understand");

      const p = pj.parsed ?? {};
      const profileRes = await fetch("/api/senior/ai/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredCity: p.preferredCity ?? undefined,
          budgetBand: budgetBandFromMonthly(p.budgetMonthly ?? null),
          whoFor: p.whoFor ?? undefined,
          careNeedLevel: p.careNeedLevel ?? undefined,
          urgencyLevel: p.urgencyLevel ?? undefined,
        }),
      });
      const prof = (await profileRes.json()) as { profileId?: string; error?: string };
      if (!profileRes.ok || !prof.profileId) throw new Error(prof.error ?? "Could not save profile");

      if (typeof window !== "undefined" && pj.spokenSummary && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(pj.spokenSummary);
        u.rate = 0.92;
        window.speechSynthesis.speak(u);
      }

      router.push(`${base}/senior-living/results?profileId=${encodeURIComponent(prof.profileId)}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }, [base, router, text]);

  return (
    <section
      className={`rounded-2xl border-2 border-neutral-800 bg-white p-5 shadow-sm ${props.compact ? "" : "mt-6"}`}
      aria-label="Speak your needs"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-600">Voice shortcut</p>
      <p className="mt-2 text-xl font-bold text-neutral-900">Say what you need — we fill in the rest</p>
      <label htmlFor="sl-voice-field" className="mt-4 block text-lg font-semibold text-neutral-800">
        Your words
      </label>
      <textarea
        id="sl-voice-field"
        rows={props.compact ? 3 : 5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Example: "I need a place in Laval for my mother, some help, around 2500"'
        className="mt-2 w-full rounded-xl border-2 border-neutral-400 p-4 text-lg text-neutral-900 placeholder:text-neutral-400"
      />
      {err ?
        <p className="mt-3 text-lg font-semibold text-red-800" role="alert">
          {err}
        </p>
      : null}
      <button
        type="button"
        disabled={busy || !text.trim()}
        onClick={() => void onGo()}
        className="sl-btn-primary mt-5 min-h-[56px] w-full text-xl font-bold disabled:opacity-50"
      >
        {busy ? "Working…" : "Find places from this"}
      </button>
    </section>
  );
}
