import { NextResponse } from "next/server";
import { runAssetExecutive } from "@/modules/agents/executive-orchestrator.service";
import { requireAgentsSession } from "../../../_auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ assetId: string }> }) {
  const auth = await requireAgentsSession();
  if (!auth.ok) return auth.response;

  const { assetId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const runMode =
    body?.runMode === "AUTOMATED" || body?.runMode === "SCHEDULED" ? body.runMode : "MANUAL";

  try {
    const result = await runAssetExecutive({
      userId: auth.userId,
      role: auth.role as import("@prisma/client").PlatformRole,
      assetId,
      runMode,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Run failed" }, { status: 500 });
  }
}
