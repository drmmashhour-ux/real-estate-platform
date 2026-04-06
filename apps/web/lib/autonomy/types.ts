/**
 * Public autonomy API (L2–L5). `AutonomyMode` is canonical in `lib/system-brain/autonomy-modes.ts`.
 */
export type { AutonomyMode } from "@/lib/system-brain/autonomy-modes";

export type ActionRisk = "low" | "medium" | "high";

export interface AutonomousAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  risk: ActionRisk;
}
