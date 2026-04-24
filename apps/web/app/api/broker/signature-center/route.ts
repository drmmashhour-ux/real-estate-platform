import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  buildBrokerSignatureCenterSnapshot,
  type SignatureCenterQuery,
} from "@/modules/signature-center/signature-center.service";
import type { SignatureCenterSectionKey } from "@/modules/signature-center/signature-center.types";

export const dynamic = "force-dynamic";

function parseQuery(searchParams: URLSearchParams): SignatureCenterQuery {
  const type = searchParams.get("type");
  const risk = searchParams.get("risk");
  const urgency = searchParams.get("urgency");
  const minV = searchParams.get("minDealValue");
  const minDealValueCents =
    minV != null && minV !== "" && Number.isFinite(Number(minV)) ? Math.round(Number(minV) * 100) : undefined;

  return {
    type:
      type === "deals" || type === "documents" || type === "investor" || type === "closing" || type === "financial" ?
        (type as SignatureCenterSectionKey)
      : "all",
    risk:
      risk === "low" || risk === "medium" || risk === "high" ? risk
      : "all",
    urgency:
      urgency === "normal" || urgency === "soon" || urgency === "urgent" ? urgency
      : "all",
    minDealValueCents,
  };
}

/**
 * GET /api/broker/signature-center — aggregated pending signature / execution queue for the broker dashboard.
 */
export async function GET(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Broker access only" }, { status: 403 });
  }

  const q = parseQuery(new URL(request.url).searchParams);
  const snapshot = await buildBrokerSignatureCenterSnapshot(userId, user.role === PlatformRole.ADMIN, q);

  return NextResponse.json(snapshot);
}
