"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

export function HostsOnboardingClient() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [city, setCity] = useState("");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const start = useCallback(async () => {
    setMsg(null);
    const res = await fetch("/api/hosts/onboarding/start", { method: "POST", body: JSON.stringify({}) });
    const j = (await res.json()) as { ok?: boolean; sessionId?: string; error?: string };
    if (!res.ok || !j.ok || !j.sessionId) {
      setMsg(j.error ?? "Could not start");
      return;
    }
    setSessionId(j.sessionId);
    setStep(0);
  }, []);

  const persistStep = useCallback(
    async (stepKey: string, data: Record<string, unknown>) => {
      if (!sessionId) return false;
      const res = await fetch("/api/hosts/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, stepKey, data }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error ?? "Could not save");
        return false;
      }
      return true;
    },
    [sessionId],
  );

  const nextFromBasics = useCallback(async () => {
    setMsg(null);
    const ok = await persistStep("property_basics", { city });
    if (ok) setStep(1);
  }, [city, persistStep]);

  const nextFromImport = useCallback(async () => {
    setMsg(null);
    if (!url) {
      setMsg("Enter a listing URL or paste your Airbnb / OTA link.");
      return;
    }
    await fetch("/api/hosts/import-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourcePlatform: "other", sourceUrl: url }),
    });
    const ok = await persistStep("listing_import", { sourceUrl: url });
    if (ok) setStep(2);
  }, [url, persistStep]);

  const finish = useCallback(async () => {
    setMsg(null);
    const ok = await persistStep("review", { acknowledged: true });
    if (!ok || !sessionId) return;
    const res = await fetch("/api/hosts/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const j = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !j.ok) {
      setMsg(j.error ?? "Could not complete");
      return;
    }
    setMsg("Saved. Finish account setup in the host dashboard when you’re ready.");
  }, [sessionId, persistStep]);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-black px-4 py-16 text-zinc-100">
      <Link href="/hosts" className="text-sm text-amber-400 hover:text-amber-300">
        ← Hosts
      </Link>
      <h1 className="mt-6 font-serif text-2xl text-white">Host onboarding</h1>
      <p className="mt-2 text-sm text-zinc-500">Low-friction steps. No automatic price changes.</p>

      {!sessionId ? (
        <button
          type="button"
          onClick={() => void start()}
          className="mt-8 w-full rounded-full bg-premium-gold py-3 text-sm font-semibold text-black"
        >
          Start
        </button>
      ) : (
        <div className="mt-8 space-y-6">
          <p className="text-xs text-zinc-500">Step {step + 1} / 3</p>

          {step === 0 ? (
            <div className="space-y-3">
              <label className="block text-sm text-zinc-300">
                Property city
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => void nextFromBasics()}
                className="w-full rounded-full border border-white/20 py-3 text-sm font-semibold text-white"
              >
                Continue
              </button>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <label className="block text-sm text-zinc-300">
                Listing URL (paste from Airbnb or another platform)
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                />
              </label>
              <p className="text-xs text-zinc-600">
                We store the URL for review. Full automated import is not guaranteed.
              </p>
              <button
                type="button"
                onClick={() => void nextFromImport()}
                className="w-full rounded-full border border-white/20 py-3 text-sm font-semibold text-white"
              >
                Save & continue
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                You’re ready to connect payouts and publish when you choose. Estimates are modeled, not guaranteed.
              </p>
              <button
                type="button"
                onClick={() => void finish()}
                className="w-full rounded-full bg-premium-gold py-3 text-sm font-semibold text-black"
              >
                Complete this flow
              </button>
            </div>
          ) : null}
        </div>
      )}

      {msg ? <p className="mt-6 text-center text-sm text-zinc-400">{msg}</p> : null}
    </main>
  );
}
