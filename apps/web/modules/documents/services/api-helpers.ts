import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { requireSessionUserIdOr401 } from "@/lib/auth/api-session";
import { prisma } from "@/lib/db";

export async function requireDocumentUser(
  request: NextRequest
): Promise<{ userId: string; role: PlatformRole } | NextResponse> {
  const r = requireSessionUserIdOr401(request);
  if (r instanceof NextResponse) return r;
  const user = await prisma.user.findUnique({
    where: { id: r.userId },
    select: { id: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }
  return { userId: user.id, role: user.role };
}
