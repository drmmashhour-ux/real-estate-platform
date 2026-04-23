import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";
import { runGrowthBrainEngine } from "@/lib/growth-brain/engine";

export const dynamic = "force-dynamic";

/** POST — manual brain run (admin). */
export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const result = await runGrowthBrainEngine(prisma);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Run failed" }, { status: 500 });
  }
}
