"use client";

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

export default function DigestPage() {
  const [digest, setDigest] = useState<DailyDigestRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest/generate", {
        method: "POST",
        body: JSON.stringify({
          ownerType: "solo_broker",
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

  const dataQuality =
    digest?.metrics && typeof digest.metrics === "object" && digest.metrics !== null
      ? (digest.metrics as Record<string, unknown>).dataQualityLabel
      : null;

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]">Morning Briefing</h1>
          <p className="text-white/60 mt-1 max-w-2xl">
            Aggregates platform activity from the start of yesterday (UTC) through now, plus latest market snapshot
            zones. Signed-in user only.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-xl px-4 py-2 bg-[#D4AF37] text-black font-semibold hover:bg-[#B8860B] transition-colors disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate Briefing"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-red-200 text-sm">{error}</div>
      ) : null}

      {typeof dataQuality === "string" ? (
        <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white/70">
          Data quality: <span className="text-[#D4AF37]">{dataQuality}</span>
        </div>
      ) : null}

      {digest ? (
        <div className="space-y-6 mt-2">
          <Section title="Summary" content={digest.summary} />

          <JsonList title="Key Highlights" raw={digest.keyHighlights} />
          <JsonList title="Opportunities" raw={digest.opportunities} />
          <JsonList title="Risks" raw={digest.risks} />
          <JsonList title="Suggested Actions" raw={digest.suggestedActions} />
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, content }: { title: string; content: string | null | undefined }) {
  return (
    <div className="bg-black border border-white/10 p-4 rounded-xl">
      <div className="text-[#D4AF37] font-semibold">{title}</div>
      <div className="mt-2 text-white/80 whitespace-pre-wrap">{content ?? "—"}</div>
    </div>
  );
}

function JsonList({ title, raw }: { title: string; raw: unknown }) {
  const items: string[] = Array.isArray(raw)
    ? raw.map((i) => (typeof i === "string" ? i : JSON.stringify(i)))
    : [];
  return (
    <div className="bg-black border border-white/10 p-4 rounded-xl">
      <div className="text-[#D4AF37] font-semibold">{title}</div>
      <ul className="mt-2 list-disc pl-5 text-white/80 space-y-1">
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
