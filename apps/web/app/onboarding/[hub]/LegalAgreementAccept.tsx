"use client";

import { useState } from "react";

const AGREEMENT_LABELS: Record<string, string> = {
  hosting_terms: "BNHub hosting terms",
  broker_terms: "Broker / real estate professional terms",
  developer_terms: "Developer / projects terms",
  platform_terms: "Platform terms of use",
};

export function LegalAgreementAccept({
  userId,
  hub,
  agreementType,
  accentColor,
}: {
  userId: string;
  hub: string;
  agreementType: string;
  accentColor: string;
}) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleAccept() {
    if (!accepted) return;
    setLoading(true);
    try {
      const res = await fetch("/api/legal/accept-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hub, type: agreementType }),
      });
      if (res.ok) setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-lg border border-emerald-800 bg-emerald-950/40 p-4">
        <p className="font-medium text-emerald-200">Terms accepted.</p>
        <p className="mt-1 text-sm text-slate-400">You can continue with the onboarding steps below.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-slate-700 bg-slate-900/60 p-6">
      <h2 className="font-semibold text-slate-200">
        {AGREEMENT_LABELS[agreementType] ?? agreementType}
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        You must accept the legal terms for this hub before managing listings or professional actions.
      </p>
      <label className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="rounded border-slate-500"
        />
        <span className="text-sm text-slate-300">I have read and accept the terms</span>
      </label>
      <button
        type="button"
        disabled={!accepted || loading}
        onClick={handleAccept}
        className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: accepted ? accentColor : undefined }}
      >
        {loading ? "Saving…" : "Accept and continue"}
      </button>
    </div>
  );
}
