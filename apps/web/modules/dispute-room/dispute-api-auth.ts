import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";

import { requireSessionUserIdOr401 } from "@/lib/auth/api-session";
import { prisma } from "@/lib/db";

export async function getDisputeActor(
  request: NextRequest
): Promise<{ userId: string; role: PlatformRole } | NextResponse> {
  const auth = await requireSessionUserIdOr401(request);
  if (auth instanceof NextResponse) return auth;
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return { userId: user.id, role: user.role };
}
