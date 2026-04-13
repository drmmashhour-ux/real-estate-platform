"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { identifyUser } from "@/lib/analytics";

const PLAN_PREF_KEY = "lecipm_mortgage_plan_pref";

export function SignupExpertClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [legalOk, setLegalOk] = useState(false);
  const [planHint, setPlanHint] = useState<string | null>(null);

  useEffect(() => {
    const raw = searchParams.get("plan")?.toLowerCase().trim() ?? "";
    if (raw === "gold" || raw === "platinum" || raw === "ambassador") {
      setPlanHint(raw);
      try {
        sessionStorage.setItem(PLAN_PREF_KEY, raw);
      } catch {
        /* ignore */
      }
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    if (!legalOk) {
      setErr("Please confirm you agree to the Terms, Privacy Policy, and Platform Rules.");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
      role: "MORTGAGE_EXPERT",
      acceptLegal: true,
    };
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; userId?: string; email?: string };
      if (!res.ok) {
        setErr(j.error ?? "Signup failed");
        return;
      }
      if (j.userId && j.email) {
        identifyUser({ id: j.userId, email: j.email });
      }
      router.push("/expert/terms");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-6">
      {planHint ? (
        <p className="rounded-lg border border-premium-gold/35 bg-[#14110a]/80 px-3 py-2 text-xs text-[#d4c9a8]">
          You&apos;re starting as a <strong className="text-premium-gold">{planHint}</strong> partner candidate. After
          terms, you&apos;ll complete your <strong className="text-white">AMF licence &amp; ID verification</strong>, then
          activate billing.
        </p>
      ) : null}
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <div>
        <label className="text-xs font-semibold text-premium-gold/90">Email *</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-premium-gold/90">Password * (min 8)</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
        />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#0B0B0B]/80 px-3 py-3 text-xs text-[#B3B3B3]">
        <input
          type="checkbox"
          className="mt-0.5 accent-premium-gold"
          checked={legalOk}
          onChange={(e) => setLegalOk(e.target.checked)}
        />
        <span>I agree to the Terms, Privacy Policy, and Platform Rules.</span>
      </label>
      <button
        type="submit"
        disabled={loading || !legalOk}
        className="w-full rounded-xl bg-premium-gold py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create account"}
      </button>
      <p className="text-center text-xs text-[#737373]">
        After sign-in you&apos;ll add your professional details, AMF licence, photo, and ID — not at this step.
      </p>
    </form>
  );
}
