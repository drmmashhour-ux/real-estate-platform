"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Mode = "flight" | "package";

type PartnerContext = {
  partnerLinks: { id: string; label: string; description: string; href: string }[];
  disclosure: string;
  staysPath: string;
  aiTravelAssistantEnabled: boolean;
};

type AiResult = {
  headline: string;
  bullets: string[];
  checklist: string[];
  searchPhrases: string[];
  whyBookEarly: string;
  staysHook: string;
  disclaimer: string;
  source: string;
};

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

export function TravelCompareClient() {
  const [mode, setMode] = useState<Mode>("package");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [ctx, setCtx] = useState<PartnerContext | null>(null);
  const [ctxLoading, setCtxLoading] = useState(true);
  const [result, setResult] = useState<AiResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bnhub/travel/partner-context");
        const data = (await res.json()) as PartnerContext;
        if (!cancelled && data?.disclosure) setCtx(data);
      } catch {
        if (!cancelled) setCtx(null);
      } finally {
        if (!cancelled) setCtxLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/bnhub/travel/shopping-hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          routeOrTripSummary: summary,
          pastedNotes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult({
        headline: data.headline ?? "",
        bullets: data.bullets ?? [],
        checklist: data.checklist ?? [],
        searchPhrases: data.searchPhrases ?? [],
        whyBookEarly: data.whyBookEarly ?? "",
        staysHook: data.staysHook ?? "",
        disclaimer: data.disclaimer ?? "",
        source: data.source ?? "",
      });
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const staysPath = ctx?.staysPath ?? "/bnhub/stays";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/bnhub/stays" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← BNHUB stays
          </Link>
          {!ctxLoading && ctx?.aiTravelAssistantEnabled === false ? (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200 ring-1 ring-amber-500/35">
              AI assistant uses built-in tips until OpenAI is configured
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200 ring-1 ring-emerald-500/35">
              AI travel assistant
            </span>
          )}
        </div>

        <header className="mt-8 text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Plan smarter trips — then stay with BNHUB
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            Our assistant helps you compare <span className="text-slate-300">what you already found</span> (paste quotes
            or notes). We don&apos;t scrape airlines or steal prices — we build trust so you come back to book stays and
            experiences on-platform.
          </p>
        </header>

        {!ctxLoading && ctx && ctx.partnerLinks.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Book on official sites</h2>
            <p className="mt-1 text-xs text-slate-500">
              Use the links your team has approved (affiliate, agency, or direct). Configure with env vars — see{" "}
              <code className="text-slate-400">apps/web/.env.example</code>.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {ctx.partnerLinks.map((p) => (
                <li key={p.id}>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-950/50 p-4 transition hover:border-emerald-500/40 hover:bg-slate-900/80"
                  >
                    <span className="font-semibold text-emerald-300">{p.label}</span>
                    <span className="mt-1 text-xs text-slate-500">{p.description}</span>
                    <span className="mt-3 text-xs font-medium text-slate-400">Open in new tab →</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-snug text-slate-600">{ctx.disclosure}</p>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5">
          <h2 className="text-sm font-semibold text-emerald-200">Add a BNHUB stay to your trip</h2>
          <p className="mt-2 text-sm text-slate-400">
            Airport nights, city tours, or a week near the beach — verified hosts and clear pricing in one place.
          </p>
          <Link
            href={staysPath}
            className="mt-4 inline-flex rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Browse stays
          </Link>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-lg font-semibold text-white">AI comparison coach</h2>
          <p className="mt-1 text-sm text-slate-500">
            Describe your trip or paste fare/package text. You get checklists and search phrases — not live fares.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("package")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === "package"
                  ? "bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-500/45"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-800/80"
              }`}
            >
              All-inclusive / package
            </button>
            <button
              type="button"
              onClick={() => setMode("flight")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === "flight"
                  ? "bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-500/45"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-800/80"
              }`}
            >
              Flights only
            </button>
          </div>

          <label className="mt-5 block text-xs font-medium text-slate-500">
            Trip summary
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={
                mode === "flight"
                  ? "e.g. Montreal (YUL) to Punta Cana, March 12–19, 2 adults, direct preferred"
                  : "e.g. 7 nights Riviera Maya, 5★ adults-only, transfers + flights from Toronto"
              }
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600"
            />
          </label>

          <label className="mt-4 block text-xs font-medium text-slate-500">
            Optional: paste prices, inclusions, or email snippets
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Paste anything you were quoted — the AI will help you spot gaps and questions to ask."
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600"
            />
          </label>

          <button
            type="button"
            disabled={loading || !summary.trim()}
            onClick={() => void run()}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-40"
          >
            {loading ? "Generating your plan…" : "Run AI assistant"}
          </button>
        </section>

        {result && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {result.source === "openai" ? "AI plan" : "Built-in plan"}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">{result.headline}</h3>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-300">
                {result.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            {result.searchPhrases.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                <h3 className="text-sm font-semibold text-slate-200">Search phrases to try</h3>
                <p className="mt-1 text-xs text-slate-500">Copy into airline or tour-operator search boxes.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.searchPhrases.map((phrase, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        void copyText(phrase).then(() => {
                          setCopied(phrase);
                          setTimeout(() => setCopied(null), 2000);
                        });
                      }}
                      className="max-w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-left text-xs text-slate-300 hover:border-emerald-500/40"
                    >
                      {copied === phrase ? "Copied" : phrase}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-400">Timing</h3>
                <p className="mt-2 text-sm text-sky-100/90">{result.whyBookEarly}</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Stay on BNHUB</h3>
                <p className="mt-2 text-sm text-emerald-100/85">{result.staysHook}</p>
                <Link href={staysPath} className="mt-3 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                  Find a stay →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="text-xs font-semibold text-slate-500">Before you pay</h3>
              <ul className="mt-2 grid gap-1 text-sm text-slate-400 sm:grid-cols-2">
                {result.checklist.map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] leading-snug text-slate-600">{result.disclaimer}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
