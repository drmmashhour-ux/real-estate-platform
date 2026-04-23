"use client";

import { useState } from "react";

type GenerateResponse = {
  success?: boolean;
  releaseReady?: boolean;
  blockingCodes?: string[];
  draft?: {
    fields?: Record<string, unknown>;
    requiredReviewFields?: string[];
    warnings?: string[];
    sourceUsed?: Array<{ field: string; sourceKey: string; reason: string }>;
    passages?: Array<{ sourceKey: string; title?: string | null; content: string; weightedScore: number }>;
  };
  validation?: { valid: boolean; errors: string[] };
  contradictions?: { valid: boolean; errors: string[]; warnings: string[] };
  sourceCoverage?: { sufficient: boolean; uncoveredFields: string[] };
  gates?: Record<string, boolean>;
};

export default function DraftingAssistantPanel({
  formType,
  knownFacts,
}: {
  formType: string;
  knownFacts: Record<string, unknown>;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/drafting/generate", {
        method: "POST",
        body: JSON.stringify({
          formType,
          userQuery: `Draft ${formType} using approved OACIQ and brokerage sources`,
          knownFacts,
          /** Set `aiGenerated: true` only after wiring broker attestation; otherwise the API returns 403 until reviewed. */
          aiGenerated: false,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const json = (await res.json()) as GenerateResponse & { error?: string };
      setResult({ ...json, error: !res.ok ? json.error ?? `HTTP ${res.status}` : json.error });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#D4AF37]/20 bg-black p-4 text-white">
      <div className="font-semibold text-[#D4AF37]">AI drafting (retrieval-first)</div>
      <p className="text-xs text-white/70">
        Retrieves approved OACIQ/book passages before any draft. Broker review is required before release when{" "}
        <code className="text-white/90">aiGenerated</code> is set.
      </p>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="bg-[#D4AF37] px-4 py-2 font-semibold text-black disabled:opacity-60"
      >
        {loading ? "Generating…" : "Generate source-grounded draft"}
      </button>

      {result && (
        <div className="space-y-3 text-sm">
          {result.error ? <div className="text-red-300">Error: {result.error}</div> : null}
          <div>Release ready: {String(result.releaseReady ?? false)}</div>
          <div>Blocking: {(result.blockingCodes ?? []).join(", ") || "None"}</div>
          <div>Validation: {(result.validation?.errors ?? []).join(", ") || "OK"}</div>
          <div>Contradictions: {(result.contradictions?.errors ?? []).join(", ") || "None"}</div>
          <div>Uncovered fields: {(result.sourceCoverage?.uncoveredFields ?? []).join(", ") || "None"}</div>
          <div>Required review: {(result.draft?.requiredReviewFields ?? []).join(", ") || "None"}</div>
          {result.draft?.passages && result.draft.passages.length > 0 ? (
            <div className="max-h-48 overflow-y-auto rounded border border-white/10 p-2 text-xs text-white/80">
              <div className="mb-1 font-medium text-[#D4AF37]">Top passages</div>
              {result.draft.passages.slice(0, 3).map((p) => (
                <div key={`${p.sourceKey}-${p.weightedScore}`} className="mb-2">
                  <span className="text-white/60">{p.sourceKey}</span> — {p.content.slice(0, 220)}…
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
