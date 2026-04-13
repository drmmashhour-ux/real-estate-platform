import { redirect } from "next/navigation";
import { readDemoModeEnabled, readUseSeededDemoDataFlag } from "./demoConfig";

/** Server / build-time: demo surfaces on when env is set. */
export function isDemoModeEnabled(): boolean {
  return readDemoModeEnabled();
}

/** Redirect to the public demos hub when demo mode is off (use in demo layout / pages). */
export function requireDemoMode(): void {
  if (!isDemoModeEnabled()) {
    redirect("/demos");
  }
}

/**
 * When true, demo data layer prefers deterministic fallback / seeded ids over opportunistic DB reads.
 * Still safe to merge real rows when they match demo listing codes.
 */
export function shouldUseSeededDemoData(): boolean {
  return readUseSeededDemoDataFlag();
}

/**
 * Demo UI must not trigger irreversible production actions.
 * Use for future API routes; investor-facing pages are read-only / simulated CTAs.
 */
export function isDemoMutationAllowed(): boolean {
  return process.env.DEMO_MODE_ALLOW_MUTATIONS === "1";
}
