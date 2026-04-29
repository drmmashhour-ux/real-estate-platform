"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { generatePitchDeck } from "@/lib/demo/pitch-generator";
import { downloadPitchDeckSlidePng, printPitchDeck } from "@/lib/demo/export-pdf";

const GOLD = "var(--color-premium-gold)";

export function PitchDeck() {
  const slides = useMemo(() => generatePitchDeck(), []);
  const [idx, setIdx] = useState(0);
  const slide = slides[idx] ?? slides[0];
  const deckRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => setIdx((i) => Math.min(slides.length - 1, i + 1)), [slides.length]);
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-14 print:max-w-none print:py-6">
        <header className="print:hidden">
          <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Investor preview
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-white">Pitch deck</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#A3A3A3]">
            Demo narrative only — no live metrics, no customer data, no fabricated revenue figures.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => printPitchDeck()}
              className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-2 text-sm font-medium text-white hover:bg-white/[0.10]"
            >
              📄 Export Pitch Deck
            </button>
            <button
              type="button"
              onClick={() => void downloadPitchDeckSlidePng(deckRef.current)}
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-[#D4AF37] hover:bg-white/[0.06]"
            >
              Save slide as PNG
            </button>
          </div>
        </header>

        <div
          ref={deckRef}
          data-pitch-slide
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0C0C0C] to-[#060606] px-8 py-12 shadow-[0_0_0_1px_rgba(212,175,55,0.08)] print:border-none print:shadow-none print:py-10"
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] print:hidden">
            <div className="absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: GOLD }} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#737373]">
            Slide {idx + 1} / {slides.length}
          </p>
          <h2 className="mt-6 font-serif text-3xl font-semibold tracking-tight text-white md:text-4xl">{slide.title}</h2>
          <p className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-[#D4D4D4] md:text-xl">{slide.content}</p>
          <p className="mt-10 text-xs uppercase tracking-wider text-[#737373]">
            Visual key · <span style={{ color: GOLD }}>{slide.visual}</span>
          </p>
        </div>

        <nav className="flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={prev}
            disabled={idx === 0}
            className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/90 hover:bg-white/[0.06] disabled:opacity-30"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={next}
            disabled={idx >= slides.length - 1}
            className="rounded-full px-6 py-2 text-sm font-semibold text-[#0A0A0A] shadow-[0_0_24px_rgba(212,175,55,0.25)] disabled:opacity-30"
            style={{ background: GOLD }}
          >
            Next
          </button>
        </nav>
      </div>
    </main>
  );
}
