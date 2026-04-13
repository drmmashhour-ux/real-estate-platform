"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Persona = "find" | "list" | "invest";

export function OnboardingClient() {
  const router = useRouter();
  const [pending, setPending] = useState<Persona | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(persona: Persona) {
    setError(null);
    setPending(persona);
    try {
      const r = await fetch("/api/launch/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Could not save your choice.");
        setPending(null);
        return;
      }
      router.push(persona === "find" ? "/dashboard/guest-hub" : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setPending(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center gap-8 px-4 py-16">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-white sm:text-4xl">Welcome — what brings you here?</h1>
        <p className="mt-3 text-sm text-slate-400">
          One tap to personalize your dashboard. You can change this later from settings.
        </p>
      </div>
      {error ? (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-center text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            { id: "find" as const, title: "Find property", desc: "Browse listings and shortlist homes." },
            { id: "list" as const, title: "List property", desc: "Sell or rent with platform tools." },
            { id: "invest" as const, title: "Invest", desc: "Deals, analysis, and portfolio context." },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={pending !== null}
            onClick={() => void choose(opt.id)}
            className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-left transition hover:border-emerald-700/50 hover:bg-slate-900 disabled:opacity-60"
          >
            <span className="text-lg font-semibold text-white">{opt.title}</span>
            <span className="text-sm text-slate-400">{opt.desc}</span>
            {pending === opt.id ? <span className="text-xs text-emerald-400">Saving…</span> : null}
          </button>
        ))}
      </div>
      <div className="text-center">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void choose("find")}
          className="text-sm text-slate-500 underline decoration-slate-600 underline-offset-4 hover:text-slate-300 disabled:opacity-50"
        >
          Skip and go to dashboard (defaults to browsing)
        </button>
      </div>
    </div>
  );
}
