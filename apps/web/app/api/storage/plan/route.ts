import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { updateLimitForPlan, type StoragePlan } from "@/lib/storage-quota";

export const dynamic = "force-dynamic";

const VALID_PLANS: StoragePlan[] = ["FREE", "BASIC", "PRO"];

/**
 * PATCH /api/storage/plan
 * Body: { plan: "FREE" | "BASIC" | "PRO" }
 * Updates user's storage limit (e.g. after upgrade). Basic = 5GB, Pro = 50GB.
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const plan = body?.plan as string | undefined;
    if (!plan || !VALID_PLANS.includes(plan as StoragePlan)) {
      return Response.json(
        { error: "plan must be FREE, BASIC, or PRO" },
        { status: 400 }
      );
    }

    await updateLimitForPlan(userId, plan as StoragePlan);
    return Response.json({ success: true, plan });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update plan" }, { status: 500 });
  }
}
