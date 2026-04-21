import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/** Bearer PLAYBOOK_MEMORY_API_SECRET or ADMIN session. */
export async function authorizePlaybookMemoryApi(req: Request): Promise<boolean> {
  const secret = process.env.PLAYBOOK_MEMORY_API_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (secret && token === secret) return true;

  const userId = await getGuestId();
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}
