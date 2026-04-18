import type { LaunchSimulationAssumptions } from "./launch-simulation.types";

function pickM(t: { m1: number; m2: number; m3: number }, month: 1 | 2 | 3) {
  return month === 1 ? t.m1 : month === 2 ? t.m2 : t.m3;
}

/** Document / AI add-on fees — placeholder envelope from assumptions (not invoiced data). */
export function computeUpsellMonthRevenue(a: LaunchSimulationAssumptions, month: 1 | 2 | 3): {
  docAiCad: number;
  notes: string[];
} {
  const v = pickM(a.docAiFeeCadMonth, month);
  return {
    docAiCad: v,
    notes: ["Aggregated AI/document fee envelope — replace with product SKU attach rates when available."],
  };
}
