import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getBrokerLicenceDisplay } from "@/lib/compliance/oaciq/broker-licence-service";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER) {
    return NextResponse.json({ error: "Broker role required" }, { status: 403 });
  }

  const evaluation = await getBrokerLicenceDisplay(auth.user.id);
  return NextResponse.json({
    evaluation: {
      allowed: evaluation.allowed,
      riskLevel: evaluation.riskLevel,
      uiStatus: evaluation.uiStatus,
      label: evaluation.label,
      reasons: evaluation.reasons,
      warnings: evaluation.warnings,
    },
  });
}
