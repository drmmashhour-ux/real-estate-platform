"use client";

import { useState } from "react";

type Props = {
  workflowType: string;
  actorType: string;
  enabled: boolean;
  label?: string;
  onSubmitted?: () => void;
};

export function LegalSubmitWorkflowButton({
  workflowType,
  actorType,
  enabled,
  label = "Submit workflow for review",
  onSubmitted,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!enabled || !workflowType) {
    return null;
  }

  async function handleClick() {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/legal/workflow/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ workflowType, actorType }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        missingRequirementIds?: string[];
      };
      if (!res.ok) {
        const hint =
          data.missingRequirementIds?.length ?
            ` Missing items: ${data.missingRequirementIds.join(", ")}.`
          : "";
        setMsg({ ok: false, text: (data.error || "Submission failed.") + hint });
        return;
      }
      setMsg({
        ok: true,
        text: "Submitted for operator review. No automated approval occurs.",
      });
      onSubmitted?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleClick()}
        className="rounded-lg border border-premium-gold/40 bg-transparent px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/10 disabled:opacity-50"
      >
        {busy ? "Submitting…" : label}
      </button>
      {msg ? (
        <p className={`text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      ) : null}
    </div>
  );
}
