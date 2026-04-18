import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export async function requireBrokerOrAdminJson(): Promise<{ userId: string; role: string } | Response> {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return Response.json({ error: "Broker access only" }, { status: 403 });
  }
  return { userId, role: user.role };
}
