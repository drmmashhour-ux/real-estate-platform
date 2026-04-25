import { NextResponse } from "next/server";
import {
  assertBrokerProfessionalInsuranceActiveOrThrow,
  BrokerProfessionalInsuranceError,
} from "@/lib/compliance/oaciq/broker-professional-insurance.service";

/** Returns 403 JSON when enforcement is on and the broker has no in-force professional liability coverage. */
export async function requireActiveBrokerProfessionalInsurance(
  brokerId: string | null | undefined,
  context: string,
): Promise<NextResponse | null> {
  try {
    await assertBrokerProfessionalInsuranceActiveOrThrow(brokerId, context);
    return null;
  } catch (e) {
    if (e instanceof BrokerProfessionalInsuranceError) {
      return NextResponse.json(
        { error: e.message, code: "BROKER_PROFESSIONAL_INSURANCE_REQUIRED" },
        { status: 403 },
      );
    }
    throw e;
  }
}
