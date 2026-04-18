import type { PitchDeckContent, PitchSlide } from "./pitch-content.types";
import type { StoredPitchOverrides } from "@/lib/founder-simulation-state.service";

function mergeSlide(base: PitchSlide, o: StoredPitchOverrides[string] | undefined): PitchSlide {
  if (!o) return base;
  return {
    ...base,
    headline: o.headline ?? base.headline,
    bullets: o.bullets ?? base.bullets,
    speakerNotes: o.speakerNotes ?? base.speakerNotes,
  };
}

/** Applies founder DB overrides onto generated deck copy (does not mutate input). */
export function applyPitchOverridesToDeck(deck: PitchDeckContent, overrides: StoredPitchOverrides | null | undefined): PitchDeckContent {
  if (!overrides || Object.keys(overrides).length === 0) return deck;
  return {
    ...deck,
    slides: deck.slides.map((s) => mergeSlide(s, overrides[String(s.slideNumber)])),
  };
}
