import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { generateDailyDigest } from "@/lib/digest/generator";

export const dynamic = "force-dynamic";

/**
 * POST /api/digest/generate — build and persist today's digest for the signed-in user.
 * Body: { ownerType?: string (default "solo_broker"), sendEmail?: boolean }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      ownerType?: string;
      sendEmail?: boolean;
    };
    const ownerType = typeof body.ownerType === "string" && body.ownerType.length > 0 ? body.ownerType : "solo_broker";
    const sendEmail = Boolean(body.sendEmail);

    const digest = await generateDailyDigest(ownerType, auth.id, { sendEmail });
    return NextResponse.json({ success: true, digest });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Digest failed";
    const status = msg === "GUARANTEED_OUTCOME_FORBIDDEN" ? 422 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
