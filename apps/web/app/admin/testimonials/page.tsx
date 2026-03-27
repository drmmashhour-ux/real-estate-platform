import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { TestimonialsAdminClient } from "./testimonials-admin-client";

export default async function AdminTestimonialsPage() {
  const id = await getGuestId();
  if (!id) redirect("/login?next=/admin/testimonials");
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/admin");
  return <TestimonialsAdminClient />;
}
