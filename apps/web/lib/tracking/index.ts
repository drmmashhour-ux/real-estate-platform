/**
 * LECIPM tracking kit — client: `trackEvent`; transport: `tracking-service`.
 * Core primitives remain in `lib/tracking.ts` (root) to avoid breaking existing imports.
 */
export { trackEvent, GrowthTrackEvent } from "./track-event";
export {
  CLIENT_TRACKING_INGEST_URL,
  buildClientTrackingBody,
  sendClientTrackingBeacon,
} from "./tracking-service";
export type {
  TrackingMetadata,
  ClientTrackingPayload,
  LecipmClientEventName,
  GrowthDbEventNameType,
} from "./tracking-types";
export { GrowthDbEventName } from "./tracking-types";
