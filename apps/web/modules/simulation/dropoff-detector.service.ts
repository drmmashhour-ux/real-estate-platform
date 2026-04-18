import type { DropOffPoint, SimulationStep } from "@/modules/simulation/user-simulation.types";

export function detectDropOffs(
  steps: SimulationStep[],
  conversionStatus: "converted" | "abandoned" | "blocked" | "partial" | "unknown",
): DropOffPoint[] {
  const drops: DropOffPoint[] = [];
  if (conversionStatus === "converted") return drops;

  const marked = steps.filter((s) => s.abandonedHere);
  for (const s of marked) {
    drops.push({
      stepId: s.id,
      label: s.surface ?? s.action.slice(0, 80),
      reason: inferReason(s),
      detail: s.action,
    });
  }

  if (drops.length === 0 && steps.length > 0 && conversionStatus === "abandoned") {
    const last = steps[steps.length - 1];
    drops.push({
      stepId: last.id,
      label: last.surface ?? "end_of_session",
      reason: "unknown",
      detail: "Session ended without explicit abandon marker — inferred drop-off at last step",
    });
  }

  return drops;
}

function inferReason(s: SimulationStep): DropOffPoint["reason"] {
  if (s.mood === "confused") return "confusion";
  if ((s.hesitationMs ?? 0) > 8000) return "hesitation";
  if (/price|expensive|compare/i.test(s.action)) return "price";
  if (/trust|review|verify/i.test(s.action)) return "trust";
  if (s.mistake) return "error";
  if (s.mood === "distracted" || s.mood === "impatient") return "distraction";
  return "unknown";
}
