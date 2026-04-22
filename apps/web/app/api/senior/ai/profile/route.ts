import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logError } from "@/lib/logger";
import { buildProfileFromInputs } from "@/modules/senior-living/ai/senior-ai-orchestrator.service";
import type { SeniorAiProfileInput } from "@/modules/senior-living/ai/senior-ai.types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const uid = await getGuestId();
  const input: SeniorAiProfileInput = {
    sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
    userId: typeof body.userId === "string" ? body.userId : uid ?? undefined,
    whoFor: typeof body.whoFor === "string" ? body.whoFor : null,
    ageBand: typeof body.ageBand === "string" ? body.ageBand : null,
    mobilityLevel: typeof body.mobilityLevel === "string" ? body.mobilityLevel : null,
    careNeedLevel: typeof body.careNeedLevel === "string" ? body.careNeedLevel : null,
    memorySupportNeeded: body.memorySupportNeeded === true,
    medicalSupportNeeded: body.medicalSupportNeeded === true,
    mealSupportNeeded: body.mealSupportNeeded === true,
    socialActivityPriority: body.socialActivityPriority === true,
    budgetBand: typeof body.budgetBand === "string" ? body.budgetBand : null,
    preferredCity: typeof body.preferredCity === "string" ? body.preferredCity : null,
    preferredArea: typeof body.preferredArea === "string" ? body.preferredArea : null,
    languagePreference: typeof body.languagePreference === "string" ? body.languagePreference : null,
    urgencyLevel: typeof body.urgencyLevel === "string" ? body.urgencyLevel : null,
    budgetMonthly: typeof body.budgetMonthly === "number" ? body.budgetMonthly : null,
  };

  try {
    const { id } = await buildProfileFromInputs(input);
    return NextResponse.json({ profileId: id, ok: true });
  } catch (e) {
    logError("[api.senior.ai.profile]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
