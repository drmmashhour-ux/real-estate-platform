import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSessionUserIdOr401 } from "@/lib/auth/api-session";

export type SessionUser = {
  id: string;
  role: PlatformRole;
  email: string | null;
  name: string | null;
};

export async function requireSessionUser(request: NextRequest): Promise<SessionUser | NextResponse> {
  const session = await requireSessionUserIdOr401(request);
  if (session instanceof NextResponse) return session;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, email: true, name: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return user;
}
