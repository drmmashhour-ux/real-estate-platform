import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { summarizeCalibrationHealth } from "@/modules/continuous-calibration/application/summarizeCalibrationHealth";
import { requirePlatformAdmin } from "../../model-validation/_auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const health = await summarizeCalibrationHealth(prisma);
  return NextResponse.json(health);
}
