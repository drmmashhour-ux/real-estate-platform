import type { CommandCenterDealRow } from "./command-center.types";

/** Rule-based next step copy for deal rows (auditable heuristics). */
export function dealNextActionHint(row: CommandCenterDealRow): string {
  if (row.riskHint && row.riskHint.toLowerCase().includes("high")) {
    return "De-risk terms · align compliance before counter offers.";
  }
  return "Re-engage parties · refresh score and propose a concrete next step.";
}
