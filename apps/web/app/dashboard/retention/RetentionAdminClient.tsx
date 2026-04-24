"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type InsightsPayload = {
  success?: boolean;
  insights?: {
    segment: string;
    segmentNote: string;
    returnScore: { score: number; factors: { label: string; value: number; note: string }[] };
    recommendations: {
      similarStays: { listingCode: string; title: string; city: string }[];
      previousDestinationStays: { listingCode: string; title: string; city: string }[];
      explanation: string[];
    };
    priceSuggestions: { listingCode: string; message: string; logicExplanation: string }[];
    behaviorSummary: {
      lastActivityAt: string | null;
      completedBookings: number;
      savesTotal: number;
      bookingCities: string[];
      searchesLast30d: number;
    };
    transparency: string[];
  };
  error?: string;
};

export function RetentionAdminClient() {
  const [userId, setUserId] = useState("");
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(
        `/api/retention/admin/snapshot?userId=${encodeURIComponent(userId.trim())}`,
        { credentials: "include" }
      );
      setData((await r.json()) as InsightsPayload);
    } catch {
      setData({ error: "fetch_failed" });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const ins = data?.insights;

  return (
    <div className="space-y-6">
      <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Preview guest</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <input
            className="min-w-[240px] flex-1 rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            placeholder="User id (cuid)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <Button type="button" disabled={loading || !userId.trim()} onClick={() => void load()}>
            {loading ? "Loading…" : "Load snapshot"}
          </Button>
        </div>
      </Card>

      {data?.error ? (
        <Card className="border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
          {data.error === "fetch_failed" ? "Network error." : data.error}
        </Card>
      ) : null}

      {ins ? (
        <>
          <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Segment</h2>
            <p className="mt-2 text-lg font-medium text-zinc-100">{ins.segment}</p>
            <p className="mt-2 text-sm text-zinc-400">{ins.segmentNote}</p>
            <div className="mt-4 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
              <div>Completed stays: {ins.behaviorSummary.completedBookings}</div>
              <div>Saved listings: {ins.behaviorSummary.savesTotal}</div>
              <div>Searches (30d): {ins.behaviorSummary.searchesLast30d}</div>
              <div>
                Last activity:{" "}
                {ins.behaviorSummary.lastActivityAt
                  ? new Date(ins.behaviorSummary.lastActivityAt).toLocaleString()
                  : "—"}
              </div>
            </div>
            {ins.behaviorSummary.bookingCities.length ? (
              <p className="mt-3 text-xs text-zinc-500">
                Booking cities: {ins.behaviorSummary.bookingCities.join(", ")}
              </p>
            ) : null}
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Return score</h2>
            <p className="mt-2 text-2xl font-semibold text-amber-200/90">{ins.returnScore.score}</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              {ins.returnScore.factors.map((f) => (
                <li key={f.label} className="border-l-2 border-zinc-700 pl-3">
                  <span className="font-medium text-zinc-100">{f.label}</span> ({f.value}) — {f.note}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recommendations</h2>
            <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
              {ins.recommendations.explanation.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase text-zinc-500">Similar stays</h3>
                <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                  {ins.recommendations.similarStays.slice(0, 6).map((l) => (
                    <li key={l.listingCode}>
                      {l.title} <span className="text-zinc-500">({l.city})</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-zinc-500">Previous destination</h3>
                <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                  {ins.recommendations.previousDestinationStays.slice(0, 6).map((l) => (
                    <li key={l.listingCode}>
                      {l.title} <span className="text-zinc-500">({l.city})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Price context (saved)</h2>
            <ul className="mt-3 space-y-3 text-sm text-zinc-300">
              {ins.priceSuggestions.map((p) => (
                <li key={p.listingCode} className="border-l-2 border-zinc-700 pl-3">
                  <p>{p.message}</p>
                  <p className="mt-1 text-xs text-zinc-500">{p.logicExplanation}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Transparency</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-zinc-400">
              {ins.transparency.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}
    </div>
  );
}
