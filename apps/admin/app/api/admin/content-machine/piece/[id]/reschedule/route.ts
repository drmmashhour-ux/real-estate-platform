import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { rescheduleMachineContent } from "@/lib/content-machine/scheduler";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id } = await ctx.params;
  const { created } = await rescheduleMachineContent(id);
  return NextResponse.json({ ok: true, created });
}
