import type { ConversionTrackEvent, ConversionTrigger } from "../domain/types";

export async function trackConversionClient(input: {
  event: ConversionTrackEvent;
  listingId?: string;
  leadId?: string;
  dealScore?: number;
  trustScore?: number;
  timeSpentSec?: number;
  repeatClicks?: number;
}) {
  const res = await fetch("/api/conversion/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function triggerConversionClient(input: { triggers: ConversionTrigger[]; listingId?: string }) {
  const res = await fetch("/api/conversion/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  return res.json();
}
