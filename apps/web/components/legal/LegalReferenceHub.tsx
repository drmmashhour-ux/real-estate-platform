"use client";

import { useCallback, useEffect, useState } from "react";
import type { LegalRiskEngineResult } from "@/modules/legal/engine/legal-engine.service";
import { LegalCaseList } from "@/modules/legal/components/LegalCaseList";
import { LegalRiskAnalyzer } from "@/modules/legal/components/LegalRiskAnalyzer";

type LegalCaseRow = {
  id: string;
  title: string;
  jurisdiction: string;
  summary: string;
  facts: string;
  legalIssues: string;
  decision: string;
  reasoning: string;
  outcome: string;
  sellerLiable: boolean;
  brokerLiable: boolean;
  latentDefect: boolean;
  badFaith: boolean;
};

export function LegalReferenceHub() {
  const [cases, setCases] = useState<LegalCaseRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<LegalRiskEngineResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const loadCases = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/legal/cases", { method: "GET" });
      const data = (await res.json()) as { cases?: LegalCaseRow[]; error?: string };
      setCases(Array.isArray(data.cases) ? data.cases : []);
    } catch {
      setLoadError("Could not load case library.");
      setCases([]);
    }
  }, []);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const runDemoAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeResult(null);
    try {
      const res = await fetch("/api/legal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing: { roofConditionUnknown: true, highValueProperty: true, hiddenDefect: true, serious: true, priorToSale: true },
          seller: {
            sellerProvidedInfo: true,
            incompleteDisclosure: true,
            knownDefect: true,
            notDisclosed: true,
            brokerDisclosedSource: true,
            attemptedVerification: true,
          },
          inspection: { limited: true, sellerSilenceDuringInspection: true },
        }),
      });
      const data = (await res.json()) as { evaluation?: { engine?: LegalRiskEngineResult } };
      setAnalyzeResult(data.evaluation?.engine ?? null);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-zinc-100">
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-400/90">LECIPM · Compliance</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-white">Legal reference hub</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Educational case summaries and a deterministic risk checklist (not legal advice). Flags support broker protection,
          disclosure hygiene, and latent-defect patterns.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-inner shadow-black/40">
          <h2 className="font-medium text-white">Case library</h2>
          {loadError ? <p className="mt-4 text-sm text-red-400">{loadError}</p> : null}
          {!cases.length && !loadError ? (
            <p className="mt-4 text-sm text-zinc-500">No cases loaded. Run database seed.</p>
          ) : (
            <div className="mt-4">
              <LegalCaseList
                detailHrefBase="/legal/cases"
                cases={cases.map((c) => ({
                  id: c.id,
                  title: c.title,
                  jurisdiction: c.jurisdiction,
                  latentDefect: c.latentDefect,
                  sellerLiable: c.sellerLiable,
                }))}
              />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-inner shadow-black/40">
          <h2 className="font-medium text-white">Analyzer</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Open a case card for the full narrative. Use the analyzer for structured JSON scenarios.
          </p>
          <div className="mt-4">
            <LegalRiskAnalyzer />
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-inner shadow-black/40">
        <h2 className="font-medium text-white">Quick demo (legacy engine slice)</h2>
        <p className="mt-2 text-sm text-zinc-500">
          One-click sample uses only the core engine flags — full evaluation includes broker + seller fraud modules via the
          analyzer JSON.
        </p>
        <button
          type="button"
          onClick={() => void runDemoAnalyze()}
          disabled={analyzing}
          className="mt-4 rounded-lg bg-amber-600/90 px-4 py-2 text-sm font-medium text-black hover:bg-amber-500 disabled:opacity-50"
        >
          {analyzing ? "Running…" : "Run sample analysis"}
        </button>
        {analyzeResult ? (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-black/50 p-4 text-sm">
            <p className="text-zinc-200">
              <span className="text-zinc-500">Score:</span> {analyzeResult.score}{" "}
              <span className="ml-3 text-zinc-500">Level:</span>{" "}
              <span className="font-semibold text-amber-400">{analyzeResult.riskLevel}</span>
            </p>
            <p className="mt-2 text-zinc-400">
              Flags: {analyzeResult.flags.length ? analyzeResult.flags.join(", ") : "—"}
            </p>
            <p className="mt-2 text-xs text-zinc-600">
              Broker protection rule: {analyzeResult.brokerProtectionApplied ? "applied" : "not triggered"} · Bad faith
              signal: {analyzeResult.badFaith ? "yes" : "no"} · Latent defect pattern:{" "}
              {analyzeResult.latentDefectIndicated ? "yes" : "no"}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
