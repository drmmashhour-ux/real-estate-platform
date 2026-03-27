import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/** Returns a NextResponse error if not admin; otherwise null. */
export async function assertAdminResponse(): Promise<NextResponse | null> {
  const id = await getGuestId();
  if (!id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}
