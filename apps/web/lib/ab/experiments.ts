export type Experiment = {
  id: string;
  variants: string[];
};

export const experiments: Experiment[] = [
  { id: "booking_cta", variants: ["A", "B"] },
  { id: "landing_headline", variants: ["A", "B"] },
  { id: "pricing_display", variants: ["A", "B"] },
  { id: "conversion_v1", variants: ["A", "B"] },
];

export const CONVERSION_EXPERIMENT_V1 = "conversion_v1" as const;

const byId = new Map(experiments.map((e) => [e.id, e]));

export function getExperiment(id: string): Experiment | undefined {
  return byId.get(id);
}
