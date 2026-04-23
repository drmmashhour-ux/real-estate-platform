"use client";

import Link from "next/link";
import { useState } from "react";

type DailyDigestRow = {
  id: string;
  ownerType: string;
  ownerId: string;
  date: string;
  summary: string | null;
  keyHighlights: unknown;
  risks: unknown;
  opportunities: unknown;
  suggestedActions: unknown;
  metrics: unknown;
  generatedAt: string;
};

function asCountRecord(m: unknown): Record<string, number> {
  if (!m || typeof m !== "object" || Array.isArray(m)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(m as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

export default function DigestPage() {
  const [digest, setDigest] = useState<DailyDigestRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendEmail, setSendEmail] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest/generate", {
        method: "POST",
        body: JSON.stringify({
          ownerType: "solo_broker",
          sendEmail,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? `Request failed (${res.status})`);
        setDigest(null);
        return;
      }
      setDigest(data.digest);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setDigest(null);
    } finally {
      setLoading(false);
    }
  }

  const metricsRaw =
    digest?.metrics && typeof digest.metrics === "object" && digest.metrics !== null
      ? (digest.metrics as Record<string, unknown>)
      : null;
  const dataQuality =
    metricsRaw && "dataQualityLabel" in metricsRaw ? String(metricsRaw.dataQualityLabel ?? "") : "";
  const counts =
    metricsRaw && typeof metricsRaw.counts === "object" && metricsRaw.counts !== null
      ? asCountRecord(metricsRaw.counts)
      : asCountRecord(metricsRaw);
  const countKeys = [
    "watchlistAlerts",
    "alertCandidates",
    "deals",
    "buyBoxMatches",
    "watchlistAdds",
    "brokerListingsNew",
    "dealFinderSignals",
    "buyBoxStancesUpdated",
    "marketZones",
    "marketHeatRows",
    "portfolioAutopilotOpen",
    "workflows",
  ] as const;

  return (
    <div className="min-h-screen space-y-6 bg-zinc-950 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]">Morning Briefing</h1>
          <p className="mt-1 max-w-2xl text-white/60">
            Aggregates from start of yesterday (UTC) through now, plus latest market snapshots and heat scores.
            Signed-in user only — advisory, not execution.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="rounded border-white/20"
            />
            Also email briefing (if Resend is configured)
          </label>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl bg-[#D4AF37] px-4 py-2 font-semibold text-black transition-colors hover:bg-[#B8860B] disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate briefing"}
          </button>
          <Link
            href="/dashboard/broker/portfolio/autopilot"
            className="text-center text-sm text-[#D4AF37]/90 underline-offset-2 hover:underline"
          >
            Portfolio autopilot →
          </Link>
          <Link
            href="/dashboard/broker/saved-searches"
            className="text-center text-sm text-[#D4AF37]/90 underline-offset-2 hover:underline"
          >
            Saved searches →
          </Link>
          <Link
            href="/dashboard/broker/watchlist"
            className="text-center text-sm text-[#D4AF37]/90 underline-offset-2 hover:underline"
          >
            Watchlist →
          </Link>
          <Link
            href="/dashboard/broker/alerts"
            className="text-center text-sm text-[#D4AF37]/90 underline-offset-2 hover:underline"
          >
            Alert Center →
          </Link>
          <Link
            href="/dashboard/broker/market-watch"
            className="text-center text-sm text-[#D4AF37]/90 underline-offset-2 hover:underline"
          >
            Real Estate Watch →
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {dataQuality ? (
        <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white/70">
          Data quality: <span className="text-[#D4AF37]">{dataQuality}</span>
        </div>
      ) : null}

      {digest ? (
        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
          <div className="text-sm font-semibold text-[#D4AF37]">Window activity (counts)</div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {countKeys.map((k) => (
              <div key={k} className="rounded-lg border border-white/10 bg-zinc-900/80 px-2 py-2 text-center">
                <div className="text-lg font-semibold text-white">{counts[k] ?? 0}</div>
                <div className="text-[10px] uppercase tracking-wide text-white/50">
                  {k.replace(/([A-Z])/g, " $1").trim()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {digest ? (
        <div className="mt-2 space-y-6">
          <Section title="Summary" content={digest.summary} />

          <JsonList title="Key highlights" raw={digest.keyHighlights} />
          <JsonList title="Opportunities" raw={digest.opportunities} />
          <JsonList title="Risks" raw={digest.risks} />
          <JsonList title="Suggested actions (human review)" raw={digest.suggestedActions} emphasis />
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, content }: { title: string; content: string | null | undefined }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black p-4">
      <div className="font-semibold text-[#D4AF37]">{title}</div>
      <div className="mt-2 whitespace-pre-wrap text-white/80">{content ?? "—"}</div>
    </div>
  );
}

function JsonList({
  title,
  raw,
  emphasis,
}: {
  title: string;
  raw: unknown;
  emphasis?: boolean;
}) {
  const items: string[] = Array.isArray(raw)
    ? raw.map((i) => (typeof i === "string" ? i : JSON.stringify(i)))
    : [];
  return (
    <div
      className={`rounded-xl border p-4 ${
        emphasis ? "border-[#D4AF37]/40 bg-[#D4AF37]/5" : "border-white/10 bg-black"
      }`}
    >
      <div className="font-semibold text-[#D4AF37]">{title}</div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-white/80">
        {items.length ? (
          items.map((i, idx) => (
            <li key={idx} className="whitespace-pre-wrap">
              {i}
            </li>
          ))
        ) : (
          <li className="text-white/40">None in this briefing.</li>
        )}
      </ul>
    </div>
  );
}
