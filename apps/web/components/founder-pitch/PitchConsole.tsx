"use client";

import { useCallback, useEffect, useState } from "react";
import type { PitchDeckContent, PitchSlide } from "@/modules/pitch-content/pitch-content.types";
import { PitchOutlinePanel } from "./PitchOutlinePanel";
import { SlidePreviewCard } from "./SlidePreviewCard";
import { SpeakerNotesPanel } from "./SpeakerNotesPanel";
import { PositioningSummaryCard } from "./PositioningSummaryCard";
import { PitchSlideEditor } from "./PitchSlideEditor";

export function PitchConsole({ basePath }: { basePath: string }) {
  const [deck, setDeck] = useState<PitchDeckContent | null>(null);
  const [active, setActive] = useState(1);
  const [tractionNote, setTractionNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/founder/pitch", { credentials: "include" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : `HTTP ${res.status}`);
      return;
    }
    const j = (await res.json()) as { deck: PitchDeckContent };
    setDeck(j.deck);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function regenerate() {
    setError(null);
    const res = await fetch("/api/founder/pitch/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ actualTractionNote: tractionNote.trim() || null }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : `HTTP ${res.status}`);
      return;
    }
    const j = (await res.json()) as { deck: PitchDeckContent };
    setDeck(j.deck);
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6 text-sm text-red-200/90">
        {error}
        <button type="button" className="ml-4 underline" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  if (!deck) {
    return <p className="text-sm text-zinc-500">Loading pitch…</p>;
  }

  const slide = deck.slides.find((s) => s.slideNumber === active) ?? deck.slides[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="lg:w-56 lg:flex-shrink-0">
          <PitchOutlinePanel slides={deck.slides} active={active} onSelect={setActive} />
        </div>
        <div className="min-w-0 flex-1 space-y-6">
          <SlidePreviewCard slide={slide} />
          <SpeakerNotesPanel notes={slide.speakerNotes} />
          <PitchSlideEditor
            slide={slide}
            onSaved={(s) => {
              setDeck((d) =>
                d
                  ? {
                      ...d,
                      slides: d.slides.map((x) => (x.slideNumber === s.slideNumber ? s : x)),
                    }
                  : d
              );
            }}
          />
        </div>
      </div>

      <PositioningSummaryCard disclaimers={deck.disclaimers} />

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
        <p className="text-sm font-medium text-zinc-200">Regenerate from simulation (optional traction note for slide 7)</p>
        <p className="mt-1 text-xs text-zinc-500">
          Paste <strong>real</strong> internal metrics only — never fabricate. Leave empty for roadmap-style slide 7.
        </p>
        <textarea
          value={tractionNote}
          onChange={(e) => setTractionNote(e.target.value)}
          rows={3}
          className="mt-3 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-200"
          placeholder="e.g. Q1 2026: X verified hosts onboarded (internal dashboard) — optional"
        />
        <button
          type="button"
          onClick={() => void regenerate()}
          className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/20"
        >
          Regenerate deck copy
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={`${basePath}/simulation`} className="text-sm text-amber-200/90 hover:underline">
          ← Simulation
        </a>
        <button
          type="button"
          className="text-sm text-emerald-300/90 hover:underline"
          onClick={() => {
            void fetch("/api/founder/export/pitch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ format: "markdown" }),
            }).then(async (r) => {
              if (!r.ok) return;
              const blob = await r.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "lecipm-pitch.md";
              a.click();
              URL.revokeObjectURL(url);
            });
          }}
        >
          Export Markdown
        </button>
      </div>
    </div>
  );
}
