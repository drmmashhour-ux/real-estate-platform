import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { userCanAccessCapitalModule } from "@/modules/capital/capital-access";
import { getLatestLenderPackage } from "@/modules/capital/lender-package.service";

export const dynamic = "force-dynamic";

const TAG = "[lender-package]";

export async function GET(_request: Request, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanAccessCapitalModule(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pkg = await getLatestLenderPackage(dealId);
  return NextResponse.json({ package: pkg });
}
