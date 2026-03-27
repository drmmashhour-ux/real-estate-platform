"use client";

import { useState } from "react";

type Props = {
  /** Current text value (e.g. from the textarea). */
  value: string;
  /** Callback with corrected text to set back into the field. */
  onCorrected: (corrected: string) => void;
  /** Optional label (default: "Correct dictation"). */
  label?: string;
  /** Disabled state. */
  disabled?: boolean;
  /** Optional class for the button. */
  className?: string;
};

/**
 * Button that runs dictation correction on the given value and calls onCorrected with the result.
 * Use next to a textarea: value={message} onCorrected={setMessage}.
 */
export function DictationCorrectionButton({
  value,
  onCorrected,
  label = "Correct dictation",
  disabled = false,
  className = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (!value.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/dictation-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to correct");
      onCorrected(data.corrected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Correction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || !value.trim()}
        className={
          className ||
          "rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50"
        }
      >
        {loading ? "Correcting…" : label}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </span>
  );
}
