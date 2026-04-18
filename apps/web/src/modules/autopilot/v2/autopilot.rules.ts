import type { AutopilotV2Trigger } from "./autopilot.types";

export type FsboSignalInput = {
  viewCount: number;
  saveCount: number;
  leadCount: number;
  priceCents: number;
  city: string;
  titleLen: number;
  descLen: number;
  imageCount: number;
  daysSinceUpdate: number;
};

const LOW_VIEWS = 14;
const LOW_SAVES = 1;
/** Require enough views before “low conversion” — avoids noisy early calls. */
const MIN_VIEWS_FOR_CONVERSION_TRIGGER = 12;
const THIN_TITLE = 12;
const THIN_DESC = 120;
const FEW_PHOTOS = 3;

/**
 * Deterministic triggers from internal signals only (no fabricated demand).
 */
export function resolveTriggersFromSignals(
  eventHint: string | undefined,
  s: FsboSignalInput,
): AutopilotV2Trigger[] {
  const out = new Set<AutopilotV2Trigger>();
  if (eventHint === "listing_created" || eventHint === "listing_updated") {
    out.add("listing_updated");
  }
  if (eventHint === "price_changed") out.add("price_gap_detected");

  if (s.viewCount < LOW_VIEWS && s.daysSinceUpdate < 21) out.add("low_views_detected");
  if (s.viewCount >= MIN_VIEWS_FOR_CONVERSION_TRIGGER && s.saveCount < LOW_SAVES) out.add("low_conversion_detected");
  if (s.titleLen < THIN_TITLE || s.descLen < THIN_DESC) out.add("listing_updated");
  if (s.imageCount < FEW_PHOTOS) out.add("listing_updated");

  return [...out];
}
