import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { getDemoSessionPublicState, syncInvestorDemoSessionExpiry } from "@/lib/demo/demo-session";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  syncInvestorDemoSessionExpiry();

  const session = getDemoSessionPublicState();

  return NextResponse.json({
    ok: true,
    demoEffective: isInvestorDemoModeActive(),
    ...session,
  });
}
