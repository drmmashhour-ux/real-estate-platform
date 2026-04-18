import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { hostEconomicsFlags } from "@/config/feature-flags";
import { getOnboardingSession } from "@/modules/host-onboarding/onboarding.service";

export const dynamic = "force-dynamic";

/** GET /api/hosts/onboarding/session/[id] */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!hostEconomicsFlags.hostOnboardingFunnelV1) {
    return NextResponse.json({ ok: false, error: "Feature disabled" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const userId = await getGuestId();
  const session = await getOnboardingSession(id);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  if (session.userId && userId && session.userId !== userId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, session });
}
