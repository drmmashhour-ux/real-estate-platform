import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { runInvestorDemoResetThrottled } from "@/lib/demo/demo-session";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const result = await runInvestorDemoResetThrottled(`manual:${admin.id}`);
  if (result.skipped) {
    return NextResponse.json({ ok: false, message: "Reset cooldown active (5 min)", skipped: true }, { status: 429 });
  }
  if (result.error) {
    return NextResponse.json({ ok: false, message: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
