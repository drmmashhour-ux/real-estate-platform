"use client";

import { useState } from "react";

const REASON_LABELS: Record<string, string> = {
  BROKER_IS_TRANSACTION_PARTY: "The broker is a party to this transaction (buyer or seller).",
  BROKER_OWNS_PLATFORM_LISTING: "The broker has a listing ownership interest tied to this property.",
  BROKER_CAPITAL_INTEREST: "The broker has a capital / investment interest linked to this listing.",
};

export function DealConflictDisclosureClient({
  dealId,
  warningMessage,
  acknowledgmentText,
  reasons,
  viewerMustAcknowledge,
  viewerHasAcknowledged,
}: {
  dealId: string;
  warningMessage: string;
  acknowledgmentText: string;
  reasons: string[];
  viewerMustAcknowledge: boolean;
  viewerHasAcknowledged: boolean;
}) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(viewerHasAcknowledged);

  async function submit() {
    setError("");
    if (!checked) {
      setError("Please confirm the acknowledgment below.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/compliance/deals/${dealId}/conflict-consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledgmentText }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not save acknowledgment");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-amber-50">
      <h2 className="text-base font-semibold text-amber-200">Broker conflict of interest</h2>
      <p className="mt-2 text-amber-100/95">{warningMessage}</p>
      {reasons.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-amber-100/80">
          {reasons.map((r) => (
            <li key={r}>{REASON_LABELS[r] ?? r}</li>
          ))}
        </ul>
      ) : null}

      {!viewerMustAcknowledge ? (
        <p className="mt-3 text-xs text-amber-200/80">
          Your broker will coordinate acknowledgments from the parties required to consent.
        </p>
      ) : done ? (
        <p className="mt-3 text-xs font-medium text-emerald-300">Your acknowledgment is on file.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-2 text-amber-100/95">
            <input
              type="checkbox"
              className="mt-1"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={loading}
            />
            <span>{acknowledgmentText}</span>
          </label>
          {error ? <p className="text-xs text-red-300">{error}</p> : null}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Submit acknowledgment"}
          </button>
        </div>
      )}
    </section>
  );
}
