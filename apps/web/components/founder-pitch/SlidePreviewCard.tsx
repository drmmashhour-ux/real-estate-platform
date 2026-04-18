"use client";

import type { PitchSlide } from "@/modules/pitch-content/pitch-content.types";

export function SlidePreviewCard({ slide }: { slide: PitchSlide }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-black p-6 shadow-lg shadow-black/40">
      <p className="text-xs uppercase tracking-wider text-amber-200/70">
        Slide {slide.slideNumber} · {slide.title}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-zinc-50">{slide.headline}</h3>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-300">
        {slide.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      {slide.optionalVisualSuggestion ? (
        <p className="mt-4 text-xs italic text-zinc-600">Visual: {slide.optionalVisualSuggestion}</p>
      ) : null}
    </article>
  );
}
