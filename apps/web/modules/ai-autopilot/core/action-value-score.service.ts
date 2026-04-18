import type { RankedAction } from "../ai-autopilot.types";
import { profitPriorityScore } from "./profit-priority.service";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Expected value / impact score (0–100) — revenue-adjacent heuristic from priority score + confidence.
 */
export function computeValueScore(action: RankedAction): { valueScore: number; notes: string[] } {
  const notes: string[] = [];
  const profit = profitPriorityScore(action);
  const conf = typeof action.confidence === "number" ? action.confidence : 0.5;
  const confPts = Math.round(conf * 35);
  const impactPts = clamp(Math.round((profit + 30) * 0.4), 0, 25);
  notes.push(`impactHeuristic ${impactPts}/25`);
  notes.push(`confidenceBlend ${Math.round(confPts * 0.5)}/~17`);
  const valueScore = clamp(Math.round(impactPts + confPts * 0.5), 0, 100);
  return { valueScore, notes };
}
