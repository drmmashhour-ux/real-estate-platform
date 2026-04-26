import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getSessionUserIdFromRequest } from "@/lib/auth/api-session";

/** Client hint for investment bottom nav: demo links when not a real account session. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const uid = await getSessionUserIdFromRequest(request);
  if (!uid) return NextResponse.json({ demo: true });
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { id: true } });
  return NextResponse.json({ demo: !user });
}
