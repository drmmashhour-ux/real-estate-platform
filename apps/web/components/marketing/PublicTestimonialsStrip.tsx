"use client";

import * as React from "react";
import { Star } from "lucide-react";

type Row = { id: string; name: string; city: string; quote: string; rating: number };

export function PublicTestimonialsStrip() {
  const [rows, setRows] = React.useState<Row[] | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/testimonials/public", { credentials: "omit" });
        const j = (await res.json()) as { testimonials?: Row[] };
        if (res.ok && Array.isArray(j.testimonials)) setRows(j.testimonials);
        else setRows([]);
      } catch {
        setRows([]);
      }
    })();
  }, []);

  if (rows === null) {
    return (
      <section className="border-b border-white/10 py-10">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-white/50 sm:px-6">Loading…</div>
      </section>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-white/10 bg-white/[0.02] py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center font-serif text-2xl font-semibold text-white sm:text-3xl">What brokers say</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-white/60">
          Real feedback from the community — we review quotes before they appear here.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => (
            <li
              key={t.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-black/40 p-5"
            >
              <div className="mb-2 flex items-center gap-0.5 text-amber-400" aria-label={`${t.rating} of 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? "fill-current" : "text-white/20"}`} />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-white/90">&ldquo;{t.quote}&rdquo;</blockquote>
              <footer className="mt-4 text-xs text-white/50">
                <span className="font-semibold text-white/80">{t.name}</span>
                {t.city ? <span> — {t.city}</span> : null}
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
