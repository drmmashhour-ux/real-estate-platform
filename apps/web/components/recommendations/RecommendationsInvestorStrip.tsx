"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Item = {
  entityType: string;
  entityId: string;
  score: number;
  confidence: number;
  explanationUserSafe: string;
  title?: string;
  subtitle?: string;
  href?: string;
};

export function RecommendationsInvestorStrip() {
  const [items, setItems] = useState<Item[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/recommendations?mode=INVESTOR&limit=5&personalization=1", { credentials: "include" });
      const j = (await res.json()) as { items?: Item[]; error?: string };
      if (!res.ok) {
        setItems([]);
        return;
      }
      setItems(j.items ?? []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (items.length === 0) return null;

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendations</p>
          <h2 className="text-lg font-semibold text-slate-900">Best-matched opportunities</h2>
          <p className="text-xs text-slate-600">Advisory only — not an offer or suitability determination.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>
      <ul className="mt-4 divide-y divide-slate-200">
        {items.map((it) => (
          <li key={`${it.entityType}-${it.entityId}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-900">{it.title ?? it.entityType}</p>
              <p className="text-sm text-slate-600">{it.subtitle}</p>
              <p className="text-xs text-slate-500">{it.explanationUserSafe}</p>
            </div>
            <div className="text-right text-sm text-slate-700">
              <span className="font-semibold">Score {it.score}</span>
              <span className="text-slate-500"> · {it.confidence}% confidence</span>
              {it.href ?
                <Link href={it.href} className="ml-2 text-slate-900 underline">
                  Open
                </Link>
              : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
