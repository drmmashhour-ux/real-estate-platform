import { requireUser, type GuardFailure, type GuardOk } from "./access-guard.service";

/**
 * Central hook for authenticated JSON APIs — extend with org scope / abuse score when needed.
 * `FEATURE_API_GUARD_V1` gates documentation + future middleware; auth behavior unchanged when off.
 */
export async function guardAuthenticatedApi(): Promise<GuardFailure | GuardOk> {
  return requireUser();
}
