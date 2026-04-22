import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { computeOnboardingProgress } from "@/modules/acquisition/onboarding.service";

export const dynamic = "force-dynamic";

/** Signed-in user onboarding milestones + completion %. */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const progress = await computeOnboardingProgress(auth.id);
    return Response.json(progress);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "onboarding_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
