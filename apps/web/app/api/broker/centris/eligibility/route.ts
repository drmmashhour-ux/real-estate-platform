import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { resolveBrokerSession } from "@/lib/compliance/broker-session";
import {
  centrisEligibilityUiLabel,
  centrisListingEligibilityEnforced,
  getBrokerCentrisListingEligibility,
} from "@/lib/centris/centris-listing-eligibility.service";

export const dynamic = "force-dynamic";

/** GET — broker Centris eligibility for dashboard / listing UI (no Centris API calls). */
export async function GET() {
  const userId = await getGuestId();
  const gate = await resolveBrokerSession(userId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const eligibility = await getBrokerCentrisListingEligibility(gate.brokerId);
  const ui = centrisEligibilityUiLabel(eligibility);

  return NextResponse.json({
    enforcementEnabled: centrisListingEligibilityEnforced(),
    ...eligibility,
    uiStatus: ui,
    uiMessage:
      ui === "eligible"
        ? "Eligible for Centris"
        : "Not connected to Centris — confirm subscription and access on your licence profile.",
  });
}
