import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { moveAcquisitionToNextStage } from "@/modules/acquisition/acquisition.service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const contact = await moveAcquisitionToNextStage(id);
  if (!contact) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, contact });
}
