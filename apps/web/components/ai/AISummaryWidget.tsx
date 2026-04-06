"use client";

import { useEffect, useState } from "react";

const GOLD = "#D4AF37";

export function AISummaryWidget() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    void fetch("/api/ai/insights")
      .then((r) => r.json())
      .then((d: { summary?: string }) => setText(d.summary ?? null))
      .catch(() => setText(null));
  }, []);
  if (!text) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0b0b] p-4 text-sm text-white/75">
      <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
        AI operations snapshot
      </h3>
      <p className="mt-2 leading-relaxed">{text}</p>
    </div>
  );
}
