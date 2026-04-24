import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { resolveBrokerSession } from "@/lib/compliance/broker-session";

export const dynamic = "force-dynamic";

/**
 * POST — reserved for future authorized Centris API integration.
 * LECIPM does not call Centris on behalf of brokers unless explicitly enabled and contracted.
 */
export async function POST() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const gate = await resolveBrokerSession(userId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  return NextResponse.json(
    {
      error:
        "Direct Centris publication is not enabled. Use GET /api/broker/listings/:id/centris-export for a manual JSON package, then upload via the Centris portal or your board-authorized workflow.",
      code: "CENTRIS_API_NOT_ENABLED",
      documentation:
        "This endpoint is a placeholder for a future authorized integration. The platform does not impersonate Centris.",
    },
    { status: 501 },
  );
}
