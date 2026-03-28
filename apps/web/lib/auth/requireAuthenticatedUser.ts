import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSessionUserIdOr401 } from "@/lib/auth/api-session";

/**
 * Route Handler guard: session cookie + valid User row. Returns 401 JSON (no redirect).
 */
export async function requireAuthenticatedUser(
  req: NextRequest
): Promise<{ id: string } | NextResponse> {
  const session = await requireSessionUserIdOr401(req);
  if (session instanceof NextResponse) return session;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { id: user.id };
}
