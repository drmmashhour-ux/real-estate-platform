import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import type { InvestorProfileInput } from "@/lib/invest/portfolio-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";

export const dynamic = "force-dynamic";

function track(eventType: string, userId: string | null, payload: object) {
  void prisma.toolUsageEvent
    .create({
      data: {
        toolKey: "investor_portfolio",
        eventType,
        userId: userId ?? undefined,
        payloadJson: payload as Prisma.InputJsonValue,
      },
    })
    .catch(() => {});
}

/** GET — latest profile for logged-in user */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ profile: null });
  const p = await prisma.investorProfile.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ profile: p, label: "estimate" });
}

/** POST — create/update investor profile */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Partial<InvestorProfileInput> & {
    name?: string;
    email?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const existing = await prisma.investorProfile.findFirst({ where: { userId } });

  const data = {
    userId,
    name: body.name ?? existing?.name,
    email: body.email ?? existing?.email,
    budgetCents: body.budgetCents ?? existing?.budgetCents,
    downPaymentCents: body.downPaymentCents ?? existing?.downPaymentCents,
    targetCities: Array.isArray(body.targetCities) ? body.targetCities : existing?.targetCities ?? [],
    strategy: body.strategy ?? existing?.strategy,
    riskTolerance: body.riskTolerance ?? existing?.riskTolerance,
    propertyTypes: Array.isArray(body.propertyTypes) ? body.propertyTypes : existing?.propertyTypes ?? [],
    targetRoiPercent: body.targetRoiPercent ?? existing?.targetRoiPercent,
    targetCashFlowCents: body.targetCashFlowCents ?? existing?.targetCashFlowCents,
    timeHorizonYears: body.timeHorizonYears ?? existing?.timeHorizonYears,
  };

  const profile = existing
    ? await prisma.investorProfile.update({ where: { id: existing.id }, data })
    : await prisma.investorProfile.create({ data });

  track("profile_saved", userId, { profileId: profile.id });
  if (process.env.NEXT_PUBLIC_ENV === "staging") {
    void trackDemoEvent(DemoEvents.EDIT_PROFILE, { profileId: profile.id }, userId);
  }
  return NextResponse.json({ ok: true, profile, label: "estimate" });
}
