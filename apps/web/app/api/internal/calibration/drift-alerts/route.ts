import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listDriftAlerts } from "@/modules/continuous-calibration/infrastructure/calibrationRepository";
import { requirePlatformAdmin } from "../../model-validation/_auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as "open" | "acknowledged" | "dismissed" | null;
  const take = Number(url.searchParams.get("take") ?? "80") || 80;

  const rows = await listDriftAlerts(prisma, {
    status: status ?? undefined,
    take,
  });

  return NextResponse.json({
    alerts: rows.map((a) => ({
      id: a.id,
      batchId: a.batchId,
      batchName: a.batch.name,
      batchCreatedAt: a.batch.createdAt.toISOString(),
      alertType: a.alertType,
      severity: a.severity,
      metricName: a.metricName,
      previousValue: a.previousValue,
      currentValue: a.currentValue,
      thresholdValue: a.thresholdValue,
      message: a.message,
      status: a.status,
      segmentKey: a.segmentKey,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
