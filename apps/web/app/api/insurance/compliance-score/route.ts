import { NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { resolveBrokerSession } from "@/lib/compliance/broker-session";
import { logCompliance } from "@/modules/compliance/insurance/insurance-log";
import { evaluateBrokerInsuranceRisk } from "@/modules/compliance/insurance/insurance-risk.engine";
import { getComplianceScoreForBroker } from "@/modules/compliance/insurance/insurance.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getGuestId();
    const gate = await resolveBrokerSession(userId);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: gate.status });
    }

    const [score, risk] = await Promise.all([
      getComplianceScoreForBroker(gate.brokerId),
      evaluateBrokerInsuranceRisk({ brokerId: gate.brokerId }),
    ]);

    logCompliance("api_compliance_score", { brokerId: gate.brokerId, score: score.score });

    return NextResponse.json({ score, risk });
  } catch (e) {
    logCompliance("api_compliance_score_error", { err: e instanceof Error ? e.message : "unknown" });
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
