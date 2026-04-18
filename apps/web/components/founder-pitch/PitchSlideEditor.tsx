"use client";

import { useEffect, useState } from "react";
import type { PitchSlide } from "@/modules/pitch-content/pitch-content.types";

export function PitchSlideEditor({
  slide,
  onSaved,
}: {
  slide: PitchSlide;
  onSaved: (updated: PitchSlide) => void;
}) {
  const [headline, setHeadline] = useState(slide.headline);
  const [bullets, setBullets] = useState(slide.bullets.join("\n"));
  const [speakerNotes, setSpeakerNotes] = useState(slide.speakerNotes);

  useEffect(() => {
    setHeadline(slide.headline);
    setBullets(slide.bullets.join("\n"));
    setSpeakerNotes(slide.speakerNotes);
  }, [slide.slideNumber, slide.headline, slide.bullets, slide.speakerNotes]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/founder/pitch/slides/${slide.slideNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          headline,
          bullets: bullets.split("\n").map((l) => l.trim()).filter(Boolean),
          speakerNotes,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus(typeof err.error === "string" ? err.error : `HTTP ${res.status}`);
        return;
      }
      const j = (await res.json()) as { deck: { slides: PitchSlide[] } };
      const next = j.deck.slides.find((s) => s.slideNumber === slide.slideNumber);
      if (next) onSaved(next);
      setStatus("Saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <h3 className="text-sm font-medium text-zinc-200">Edit slide {slide.slideNumber}</h3>
      <label className="block text-xs text-zinc-500">
        Headline
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100"
        />
      </label>
      <label className="block text-xs text-zinc-500">
        Bullets (one per line)
        <textarea
          value={bullets}
          onChange={(e) => setBullets(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100"
        />
      </label>
      <label className="block text-xs text-zinc-500">
        Speaker notes
        <textarea
          value={speakerNotes}
          onChange={(e) => setSpeakerNotes(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-100 ring-1 ring-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save overrides"}
        </button>
        {status ? <span className="text-xs text-zinc-400">{status}</span> : null}
      </div>
    </div>
  );
}
