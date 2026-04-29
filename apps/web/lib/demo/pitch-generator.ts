import { demoStory } from "@/lib/demo/demo-story";
import { narrationRegistry, type NarrationSlideKey } from "@/lib/demo/narration-registry";
import { investorStory } from "@/lib/demo/investorStory";
import { pitchScript } from "@/lib/demo/pitchScript";

export type PitchDeckSlideSpec = {
  title: string;
  content: string;
  visual: string;
  narrationKey?: NarrationSlideKey;
};

/**
 * Builds an investor-style slide outline from curated demo copy only (no fabricated KPIs).
 */
export function generatePitchDeck(): PitchDeckSlideSpec[] {
  const beats = pitchScript.map((beat, i) => {
    const keys: NarrationSlideKey[] = [
      "problem",
      "solution",
      "product",
      "technology",
      "advantage",
      "vision",
    ];
    const key = keys[i];
    const visual = key ? narrationRegistry[key].visualKey : "demo_visual";
    return {
      title: beat.title,
      content: beat.text,
      visual,
      narrationKey: key,
    };
  });

  const pillarSlide: PitchDeckSlideSpec = {
    title: "Platform pillars",
    content: [investorStory.title, "", ...demoStory.pillars.map((p) => `• ${p}`)].join("\n"),
    visual: narrationRegistry.pillars.visualKey,
    narrationKey: "pillars",
  };

  const opener: PitchDeckSlideSpec = {
    title: investorStory.title,
    content: demoStory.tagline,
    visual: narrationRegistry.title.visualKey,
    narrationKey: "title",
  };

  return [opener, ...beats, pillarSlide];
}
