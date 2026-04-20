/**
 * Core Autopilot Engine v1 — thin facade over `autopilot.service`.
 * TODO v2: event bus consumer, per-tenant modes, ML conversion scoring.
 */
import {
  runLecipmCoreAutopilotEvent,
  runFsboListingAutopilotSampleScan,
  runCrmListingCoownershipComplianceScan,
} from "./autopilot.service";
import type { LecipmCoreAutopilotEventPayload } from "./types";

export {
  runLecipmCoreAutopilotEvent,
  runFsboListingAutopilotSampleScan,
  runCrmListingCoownershipComplianceScan,
};

/** Alias for event-bus style callers. */
export function dispatchLecipmCoreAutopilotEvent(payload: LecipmCoreAutopilotEventPayload) {
  return runLecipmCoreAutopilotEvent(payload);
}
