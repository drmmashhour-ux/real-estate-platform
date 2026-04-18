"use client";

import type { PitchSlide } from "@/modules/pitch-content/pitch-content.types";

export function PitchOutlinePanel({
  slides,
  active,
  onSelect,
}: {
  slides: PitchSlide[];
  active: number;
  onSelect: (n: number) => void;
}) {
  return (
    <nav className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
      <p className="px-2 pb-2 text-xs uppercase tracking-wider text-zinc-500">Outline</p>
      <ul className="space-y-1">
        {slides.map((s) => (
          <li key={s.slideNumber}>
            <button
              type="button"
              onClick={() => onSelect(s.slideNumber)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                active === s.slideNumber ? "bg-amber-500/15 text-amber-100" : "text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-300"
              }`}
            >
              <span className="text-zinc-600">{s.slideNumber}.</span> {s.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
