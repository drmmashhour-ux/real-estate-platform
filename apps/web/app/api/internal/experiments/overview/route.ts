import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const [running, draft] = await Promise.all([
    prisma.experiment.count({ where: { status: "running" } }),
    prisma.experiment.count({ where: { status: "draft" } }),
  ]);

  return NextResponse.json({ ok: true, running, draft });
}
