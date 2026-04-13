"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const GOLD = "var(--color-premium-gold)";

export function ExpertTermsClient() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onAccept() {
    setErr("");
    if (!agreed) {
      setErr("Please confirm you agree to the terms and commission.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/mortgage/expert/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ agreed: true }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Could not save. Try again.");
        return;
      }
      router.push("/dashboard/expert/verification");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-[#E5E5E5]">
        <input
          type="checkbox"
          className="mt-1 accent-premium-gold"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span>I agree to the terms and commission (30%) and the anti-bypass / confidentiality obligations above.</span>
      </label>
      <button
        type="button"
        disabled={loading}
        onClick={() => void onAccept()}
        className="w-full rounded-xl py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
        style={{ background: GOLD }}
      >
        {loading ? "Saving…" : "Accept and continue"}
      </button>
    </div>
  );
}
