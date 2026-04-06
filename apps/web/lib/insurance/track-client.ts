"use client";

export type InsuranceTrackEventName = "lead_form_viewed" | "lead_started" | "lead_submitted" | "lead_failed";

function detectDevice(): "web" | "mobile" {
  if (typeof navigator === "undefined") return "web";
  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "web";
}

/** Fire-and-forget funnel pixel; never throws to caller. */
export function trackInsuranceLeadClient(
  eventName: InsuranceTrackEventName,
  params: {
    source: "bnbhub" | "listing" | "checkout" | "manual";
    leadType?: "travel" | "property" | "mortgage";
    variantId?: string;
  }
): void {
  try {
    const body = {
      eventName,
      source: params.source,
      leadType: params.leadType,
      variantId: params.variantId,
      device: detectDevice(),
    };
    void fetch("/api/insurance/leads/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}
