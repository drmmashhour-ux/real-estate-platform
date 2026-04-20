import { NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { resolveBrokerSession } from "@/lib/compliance/broker-session";
import { logInsurance } from "@/modules/compliance/insurance/insurance-log";
import { getBrokerInsuranceStatus } from "@/modules/compliance/insurance/insurance.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getGuestId();
    const gate = await resolveBrokerSession(userId);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: gate.status });
    }

    const payload = await getBrokerInsuranceStatus(gate.brokerId);
    logInsurance("api_status_ok", { brokerId: gate.brokerId });

    return NextResponse.json(payload);
  } catch (e) {
    logInsurance("api_status_error", { err: e instanceof Error ? e.message : "unknown" });
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
