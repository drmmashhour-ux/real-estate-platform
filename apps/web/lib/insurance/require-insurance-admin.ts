import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export async function requireInsuranceAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; response: Response }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (u?.role !== "ADMIN") {
    return { ok: false, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId };
}
