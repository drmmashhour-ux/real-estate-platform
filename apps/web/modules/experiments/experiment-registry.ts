/**
 * In-repo A/B definitions. Variants are recorded on `growth_events.metadata`:
 * `{ experimentId, variant, surface? }` — set from URL `?exp=&var=` on LPs.
 */

export type ExperimentDefinition = {
  id: string;
  surface: "landing" | "pricing" | "headline";
  description: string;
  variants: readonly string[];
};

export const LAUNCH_EXPERIMENTS: readonly ExperimentDefinition[] = [
  {
    id: "lp_hero_v1",
    surface: "landing",
    description: "Hero headline emphasis: benefit vs proof",
    variants: ["a", "b"],
  },
  {
    id: "lp_cta_v1",
    surface: "landing",
    description: "Primary CTA label test",
    variants: ["reserve", "see_dates"],
  },
  {
    id: "pricing_display_v1",
    surface: "pricing",
    description: "Show nightly total vs all-in (BNHub listing cards — future hook)",
    variants: ["nightly", "total"],
  },
] as const;

export function getExperimentById(id: string): ExperimentDefinition | undefined {
  return LAUNCH_EXPERIMENTS.find((e) => e.id === id);
}
