import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertGrowthAdmin, GrowthAuthError } from "@/src/modules/bnhub-growth-engine/services/growthAccess";
import { prisma } from "@repo/db";
import type { BnhubGrowthConnectorStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await assertGrowthAdmin(await getGuestId());
    const connectors = await prisma.bnhubGrowthConnector.findMany({ orderBy: { connectorCode: "asc" } });
    return Response.json({ connectors });
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await assertGrowthAdmin(await getGuestId());
    const body = (await request.json()) as { id: string; status?: BnhubGrowthConnectorStatus };
    const c = await prisma.bnhubGrowthConnector.update({
      where: { id: body.id },
      data: { status: body.status },
    });
    return Response.json(c);
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 400 });
  }
}
