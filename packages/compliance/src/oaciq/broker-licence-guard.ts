import { NextResponse } from "next/server";
import {
  evaluateBrokerLicenceForBrokerage,
  type BrokerageScopeInput,
} from "@/lib/compliance/oaciq/broker-licence-service";

/**
 * Returns a 403 JSON response when the broker cannot perform regulated residential brokerage on LECIPM.
 */
export async function requireActiveResidentialBrokerLicence(
  brokerUserId: string,
  scope?: BrokerageScopeInput,
): Promise<NextResponse | null> {
  const r = await evaluateBrokerLicenceForBrokerage({ brokerUserId, scope });
  if (r.allowed) return null;
  return NextResponse.json(
    {
      error: "OACIQ_LICENCE_OR_SCOPE_BLOCKED",
      reasons: r.reasons,
      warnings: r.warnings,
      riskLevel: r.riskLevel,
    },
    { status: 403 },
  );
}
