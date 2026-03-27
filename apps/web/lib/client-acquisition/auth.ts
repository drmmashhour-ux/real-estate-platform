import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function requireAcquisitionAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const id = await getGuestId();
  if (!id) {
    return { ok: false, response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return { ok: false, response: NextResponse.json({ error: "Admin only" }, { status: 403 }) };
  }
  return { ok: true, userId: id };
}
