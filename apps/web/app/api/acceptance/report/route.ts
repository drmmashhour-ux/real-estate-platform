import { requireAdmin } from "@/modules/security/access-guard.service";
import { runFinalAcceptanceChecks } from "@/modules/acceptance/checklist.engine";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const report = await runFinalAcceptanceChecks();
    return NextResponse.json(report);
  } catch (error) {
    console.error("[acceptance:api] run failed", error);
    return NextResponse.json({ error: "Failed to run acceptance checks" }, { status: 500 });
  }
}
