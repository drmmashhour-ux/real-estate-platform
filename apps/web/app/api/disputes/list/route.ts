import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { LecipmDisputeCaseCategory, LecipmDisputeCasePriority, LecipmDisputeCaseStatus } from "@prisma/client";

import { getDisputeActor } from "@/modules/dispute-room/dispute-api-auth";
import { listDisputesForUser } from "@/modules/dispute-room/dispute-case.service";

export const dynamic = "force-dynamic";

function qp(req: NextRequest, key: string): string | null {
  return req.nextUrl.searchParams.get(key);
}

export async function GET(request: NextRequest) {
  const actor = await getDisputeActor(request);
  if (actor instanceof NextResponse) return actor;

  const status = qp(request, "status") as LecipmDisputeCaseStatus | null;
  const priority = qp(request, "priority") as LecipmDisputeCasePriority | null;
  const category = qp(request, "category") as LecipmDisputeCaseCategory | null;

  const rows = await listDisputesForUser({
    userId: actor.userId,
    role: actor.role,
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(category ? { category } : {}),
  });

  return NextResponse.json({ disputes: rows });
}
