"use client";

import { useState } from "react";
import { LegalRiskBadge } from "./LegalRiskBadge";

export function LegalRiskAnalyzer() {
  const [busy, setBusy] = useState(false);
  const [json, setJson] = useState("{}");
  const [result, setResult] = useState<unknown>(null);

  async function run() {
    setBusy(true);
    try {
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(json) as Record<string, unknown>;
      } catch {
        body = {};
      }
      const res = await fetch("/api/legal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setResult(await res.json());
    } finally {
      setBusy(false);
    }
  }

  const level =
    result &&
    typeof result === "object" &&
    result !== null &&
    "evaluation" in result &&
    typeof (result as { evaluation?: { overallRiskLevel?: string } }).evaluation?.overallRiskLevel === "string"
      ? ((result as { evaluation: { overallRiskLevel: string } }).evaluation.overallRiskLevel as "MEDIUM" | "HIGH" | "CRITICAL")
      : null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Legal risk analyzer</p>
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={8}
        className="mt-3 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs text-slate-200"
        placeholder='{ "listing": {}, "seller": {}, "inspection": {}, "broker": {}, "sellerFraud": {} }'
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run()}
          className="rounded-lg bg-premium-gold px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
        >
          {busy ? "Running…" : "Run deterministic analysis"}
        </button>
        {level ? <LegalRiskBadge level={level} /> : null}
      </div>
      {result ? (
        <pre className="mt-4 max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] text-slate-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
