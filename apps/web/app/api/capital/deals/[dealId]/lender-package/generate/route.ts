import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { userCanMutateCapitalData } from "@/modules/capital/capital-access";
import { generateAndStoreLenderPackage } from "@/modules/capital/lender-package.service";

export const dynamic = "force-dynamic";

const TAG = "[lender-package]";

export async function POST(_request: Request, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanMutateCapitalData(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await generateAndStoreLenderPackage({
      pipelineDealId: dealId,
      actorUserId: userId,
    });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
