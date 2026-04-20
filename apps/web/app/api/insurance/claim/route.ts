import { NextRequest, NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { resolveBrokerSession } from "@/lib/compliance/broker-session";
import { createInsuranceClaim } from "@/modules/compliance/insurance/insurance-claim.service";
import { logClaim } from "@/modules/compliance/insurance/insurance-log";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    const gate = await resolveBrokerSession(userId);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: gate.status });
    }

    const body = (await req.json()) as {
      summary?: string;
      status?: "DRAFT" | "SUBMITTED";
      privateFileId?: string | null;
    };

    const result = await createInsuranceClaim({
      brokerId: gate.brokerId,
      summary: body.summary ?? "",
      status: body.status,
      privateFileId: body.privateFileId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    logClaim("api_post_ok", { claimId: result.claimId });

    return NextResponse.json({
      success: true,
      claimId: result.claimId,
      fingerprint: result.fingerprint,
    });
  } catch (e) {
    logClaim("api_post_error", { err: e instanceof Error ? e.message : "unknown" });
    return NextResponse.json({ error: "Claim intake unavailable" }, { status: 500 });
  }
}
