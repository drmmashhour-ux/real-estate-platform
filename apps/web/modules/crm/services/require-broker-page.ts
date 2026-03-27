import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function requireBrokerOrAdminPage(nextPath: string) {
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true, email: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }
  return user;
}
