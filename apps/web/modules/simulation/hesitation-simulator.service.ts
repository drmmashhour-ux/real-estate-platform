import type { SimulationPersona, SimulationStep } from "@/modules/simulation/user-simulation.types";

/** Attach plausible hesitation — symbolic ms for logging, not real sleep unless E2E adds it. */
export function withHesitation(
  step: Omit<SimulationStep, "at" | "hesitationMs"> & { hesitationMs?: number },
  persona: SimulationPersona,
): SimulationStep {
  const base = persona === "busy_broker_mobile" ? 200 : persona === "confused_user" ? 4000 : 1200;
  const jitter = (step.id?.length ?? 0) * 37;
  const hesitationMs = step.hesitationMs ?? base + (jitter % 800);
  return {
    ...step,
    at: new Date().toISOString(),
    hesitationMs,
  };
}

export function simulatePaymentHesitation(persona: SimulationPersona): number {
  if (persona === "price_sensitive_guest") return 9000;
  if (persona === "curious_guest") return 3500;
  if (persona === "confused_user") return 12000;
  return 5000;
}
